import type { Socket } from "net"
import { exec } from "child_process"

// Communication logs storage (in production, use a database)
let communicationLogs: any[] = []

// Printer state
const printerState = {
  connected: false,
  printing: false,
  cartridgeLevel: 0,
  position: 0,
}

// Connection configuration
interface ConnectionConfig {
  tcp: {
    host: string
    port: number
  }
  machineNumber: number
}

let connectionConfig: ConnectionConfig = {
  tcp: {
    host: "169.254.59.119",
    port: 139,
  },
  machineNumber: 119,
}

let tcpClient: Socket | null = null

/**
 * Update connection configuration
 */
export function updateConnectionConfig(config: ConnectionConfig) {
  connectionConfig = config
  // Close existing connections
  if (tcpClient) {
    tcpClient.destroy()
    tcpClient = null
  }
  printerState.connected = false
}

/**
 * Get current connection configuration
 */
export function getConnectionConfig(): ConnectionConfig {
  return connectionConfig
}

/**
 * Initialize TCP connection
 */
function initTCPConnection(): Socket | null {
  if (tcpClient && !tcpClient.destroyed) {
    return tcpClient
  }

  try {
    const net = require("net")
    tcpClient = new net.Socket()

    tcpClient.connect(connectionConfig.tcp.port, connectionConfig.tcp.host, () => {
      console.log("[v0] TCP connection established")
      printerState.connected = true
    })

    tcpClient.on("error", (err) => {
      console.error("[v0] TCP error:", err)
      printerState.connected = false
    })

    tcpClient.on("close", () => {
      console.log("[v0] TCP connection closed")
      printerState.connected = false
    })

    return tcpClient
  } catch (error) {
    console.error("[v0] Failed to initialize TCP connection:", error)
    return null
  }
}

/**
 * Calculate checksum for TIJ protocol
 */
function calculateChecksum(data: Buffer): number {
  let sum = 0
  for (let i = 0; i < data.length; i++) {
    sum += data[i]
  }
  const checksum = (0x100 - (sum & 0xff)) & 0xff
  return checksum
}

/**
 * Build command packet with configurable machine number
 */
export function buildCommand(commandId: number, data: Buffer): Buffer {
  const header = Buffer.from([0x1b, 0x02]) // ESC STX
  const machineNumber = Buffer.from([connectionConfig.machineNumber || 0x00])
  const commandIdBuf = Buffer.from([commandId])
  const footer = Buffer.from([0x1b, 0x03]) // ESC ETX

  const commandData = Buffer.concat([header, machineNumber, commandIdBuf, data, footer])

  const checksum = calculateChecksum(commandData)

  console.log(`[v0] Built command 0x${commandId.toString(16).toUpperCase().padStart(2, "0")}:`)
  console.log(`[v0]   Command data (hex): ${commandData.toString("hex").toUpperCase()}`)
  console.log(`[v0]   Checksum: 0x${checksum.toString(16).toUpperCase().padStart(2, "0")}`)

  return Buffer.concat([commandData, Buffer.from([checksum])])
}

const STATUS_CODE_MAP: Record<number, string> = {
  0: "成功 - 无错误",
  1: "喷码机错误",
  11: "二维码子模块数过多",
  13: "序列号编号不存在",
  14: "字段数过少",
  15: "账号密码错误",
  16: "信息名不存在",
  17: "喷印已启动",
  18: "喷印未启动",
  19: "编组模式",
  20: "打印间隔过小",
  21: "信息保存失败",
  22: "喷嘴选择-双列",
  23: "固定速度",
  24: "班次模块时间重叠",
  66: "缓存刚满",
  67: "缓存仍满",
  253: "服务到期",
  254: "喷码机解锁",
  255: "喷码机锁定",
}

const COMMAND_NAME_MAP: Record<number, string> = {
  0: "握手通信",
  1: "发送打印",
  2: "加锁",
  3: "解锁",
  7: "获取打印小计",
  8: "获取产品小计",
  9: "获取打印总计",
  10: "获取产品总计",
  11: "复位小计",
  12: "复位总计",
  13: "复位序列号",
  14: "设置序列号",
  17: "启动喷印",
  18: "停止喷印",
  19: "触发喷印",
  20: "获取报警状态",
  21: "取消报警闪烁",
  24: "设置字体名称",
  25: "设置字体大小",
  26: "设置字体间距",
  28: "发送信息文件",
  29: "填充远端字段数据",
  30: "加载信息库信息",
  31: "获取信息库文件名",
  32: "设置打印模式",
  33: "清除1D缓存区",
  34: "设置闪喷",
  35: "清洗喷头",
  38: "获取墨盒余量",
  39: "喷嘴选择",
  40: "设置光眼有效电平",
  41: "设置左右翻转",
  42: "设置上下颠倒",
  43: "设置扫描方向",
  44: "设置灰度",
  45: "设置喷头电压",
  46: "设置打印脉宽",
  47: "设置双列间距",
  48: "设置编码器分辨率",
  49: "设置编码器靠轮直径",
  50: "设置打印延迟",
  51: "获取远端字段数据缓存数",
  52: "设置字段最大缓存数",
  53: "开启触发信号",
  54: "开启保留字段最后信息",
  55: "设置翻转延迟",
  56: "设置喷头选择",
  57: "设置喷头重叠",
  64: "设置墨盒参数设置模式",
  65: "执行探测电压",
  66: "获取当前信息墨点数",
  80: "发送文件",
  253: "墨盒唯一标识",
}

/**
 * Parse response packet with detailed information
 */
function parseResponse(response: Buffer): {
  machineNumber: number
  statusCode: number
  commandId: number
  data: Buffer
  statusText: string
} {
  if (response[0] !== 0x1b || (response[1] !== 0x06 && response[1] !== 0x15)) {
    throw new Error("Invalid response format")
  }

  const machineNumber = response[2]
  const statusCode = response[3]
  const commandId = response[4]
  const data = response.slice(5, response.length - 3)

  const statusText = STATUS_CODE_MAP[statusCode] || `未知状态码: 0x${statusCode.toString(16).toUpperCase()}`

  return { machineNumber, statusCode, commandId, data, statusText }
}

/**
 * Send command and wait for response
 */
async function sendCommand(
  commandId: number,
  commandName: string,
  data: Buffer = Buffer.alloc(0),
): Promise<{ success: boolean; statusCode: number; data: Buffer; statusText?: string }> {
  return new Promise(async (resolve, reject) => {
    const connection = initTCPConnection()

    if (!connection) {
      reject(new Error("TCP connection not available"))
      return
    }

    const command = buildCommand(commandId, data)

    const standardCommandName = COMMAND_NAME_MAP[commandId] || commandName

    // Log sent command
    addLog({
      direction: "send",
      commandId: `0x${commandId.toString(16).toUpperCase().padStart(2, "0")}`,
      commandName: standardCommandName,
      data: data.length > 0 ? data.toString("hex").toUpperCase() : "无数据",
      rawHex: command.toString("hex").toUpperCase(),
      parsed: {
        header: command.slice(0, 2).toString("hex").toUpperCase(),
        machineNumber: command[2].toString(16).toUpperCase().padStart(2, "0"),
        commandId: command[3].toString(16).toUpperCase().padStart(2, "0"),
        data: data.toString("hex").toUpperCase() || "无",
        footer: command.slice(-3, -1).toString("hex").toUpperCase(),
        checksum: command[command.length - 1].toString(16).toUpperCase().padStart(2, "0"),
      },
    })

    // Log sent command details
    console.log("[v0] Sending command:", command.toString("hex").toUpperCase())
    console.log("[v0] Command breakdown:")
    console.log("  Header: 1B02 (报文开始)")
    console.log("  Machine Number:", command[2].toString(16).toUpperCase().padStart(2, "0"))
    console.log("  Command ID:", command[3].toString(16).toUpperCase().padStart(2, "0"), `(${standardCommandName})`)
    console.log("  Data:", data.toString("hex").toUpperCase() || "无")
    console.log("  Footer: 1B03 (报文结束)")
    console.log("  Checksum:", command[command.length - 1].toString(16).toUpperCase().padStart(2, "0"))

    connection.write(command)

    // Handle response chunks
    const timeout = setTimeout(() => {
      connection.removeListener("data", handleData)
      connection.removeListener("error", handleError)
      connection.removeListener("close", handleClose)
      reject(new Error("Response timeout"))
    }, 5000)

    let responseBuffer = Buffer.alloc(0)

    const handleData = (chunk: Buffer) => {
      console.log("[v0] Received chunk:", chunk.toString("hex").toUpperCase(), `(${chunk.length} bytes)`)
      responseBuffer = Buffer.concat([responseBuffer, chunk])

      console.log(
        "[v0] Current buffer:",
        responseBuffer.toString("hex").toUpperCase(),
        `(${responseBuffer.length} bytes)`,
      )

      // Check if complete response is received
      if (responseBuffer.length >= 8) {
        // Check for valid response header
        if (responseBuffer[0] === 0x1b && (responseBuffer[1] === 0x06 || responseBuffer[1] === 0x15)) {
          // Find response footer
          const footerIndex = responseBuffer.indexOf(Buffer.from([0x1b, 0x03]))
          if (footerIndex !== -1 && responseBuffer.length >= footerIndex + 3) {
            // Extract complete response
            const completeResponse = responseBuffer.slice(0, footerIndex + 3)
            console.log("[v0] Complete response:", completeResponse.toString("hex").toUpperCase())

            clearTimeout(timeout)
            connection.removeListener("data", handleData)
            connection.removeListener("error", handleError)
            connection.removeListener("close", handleClose)

            try {
              const parsed = parseResponse(completeResponse)

              console.log("[v0] Parsed response:")
              console.log("  Header:", completeResponse.slice(0, 2).toString("hex").toUpperCase(), "(1B06 = ACK)")
              console.log("  Machine Number:", parsed.machineNumber)
              console.log(
                "  Status Code:",
                `0x${parsed.statusCode.toString(16).toUpperCase().padStart(2, "0")}`,
                `-`,
                parsed.statusText,
              )
              console.log("  Command ID:", `0x${parsed.commandId.toString(16).toUpperCase().padStart(2, "0")}`)
              console.log("  Data:", parsed.data.toString("hex").toUpperCase() || "无")
              console.log(
                "  Footer:",
                completeResponse.slice(-3, -1).toString("hex").toUpperCase(),
                "(1B03 = 报文结束)",
              )
              console.log(
                "  Checksum:",
                completeResponse[completeResponse.length - 1].toString(16).toUpperCase().padStart(2, "0"),
              )

              addLog({
                direction: "receive",
                commandId: `0x${parsed.commandId.toString(16).toUpperCase().padStart(2, "0")}`,
                commandName: `${standardCommandName} 响应`,
                data: parsed.data.length > 0 ? parsed.data.toString("hex").toUpperCase() : "无数据",
                rawHex: completeResponse.toString("hex").toUpperCase(),
                parsed: {
                  header: completeResponse.slice(0, 2).toString("hex").toUpperCase(),
                  machineNumber: `0x${parsed.machineNumber.toString(16).toUpperCase().padStart(2, "0")} (机号${parsed.machineNumber})`,
                  statusCode: `0x${parsed.statusCode.toString(16).toUpperCase().padStart(2, "0")} (${parsed.statusText})`,
                  commandId: `0x${parsed.commandId.toString(16).toUpperCase().padStart(2, "0")}`,
                  data: parsed.data.toString("hex").toUpperCase() || "无",
                  footer: completeResponse.slice(-3, -1).toString("hex").toUpperCase(),
                  checksum: completeResponse[completeResponse.length - 1].toString(16).toUpperCase().padStart(2, "0"),
                },
                statusText: parsed.statusText,
              })

              resolve({
                success: parsed.statusCode === 0x00,
                statusCode: parsed.statusCode,
                data: parsed.data,
                statusText: parsed.statusText,
              })
            } catch (error) {
              console.error("[v0] Parse error:", error)
              reject(error)
            }
          }
        } else {
          console.log("[v0] Invalid response header:", responseBuffer.slice(0, 2).toString("hex").toUpperCase())
        }
      }
    }

    const handleError = (err: Error) => {
      console.error("[v0] Connection error during command:", err)
      clearTimeout(timeout)
      connection.removeListener("data", handleData)
      connection.removeListener("close", handleClose)
      reject(err)
    }

    const handleClose = () => {
      console.log("[v0] Connection closed by printer")
      clearTimeout(timeout)
      connection.removeListener("data", handleData)
      connection.removeListener("error", handleError)

      // If connection closed but have data, try to parse
      if (responseBuffer.length > 0) {
        console.log("[v0] Connection closed, but have buffer:", responseBuffer.toString("hex").toUpperCase())
        reject(new Error(`Connection closed unexpectedly. Received: ${responseBuffer.toString("hex").toUpperCase()}`))
      } else {
        reject(new Error("Connection closed without response"))
      }
    }

    connection.on("data", handleData)
    connection.on("error", handleError)
    connection.on("close", handleClose)
  })
}

/**
 * Add communication log
 */
function addLog(log: any) {
  communicationLogs.unshift({
    id: Date.now().toString() + Math.random(),
    timestamp: new Date().toLocaleTimeString("zh-CN"),
    ...log,
  })

  // Keep only last 50 logs
  if (communicationLogs.length > 50) {
    communicationLogs = communicationLogs.slice(0, 50)
  }
}

/**
 * Get printer status - NO AUTO CONNECTION
 */
export async function getPrinterStatus() {
  try {
    if (!printerState.connected || !tcpClient || tcpClient.destroyed) {
      return {
        connected: false,
        cartridgeLevel: 0,
        cpuTemperature: await getCPUTemperature(),
        printing: false,
        error: null,
      }
    }

    // Get cartridge level (command 0x26)
    try {
      const cartridgeResponse = await sendCommand(0x26, "获取墨盒余量")
      printerState.cartridgeLevel = cartridgeResponse.data.readUInt8(0)
    } catch (error) {
      console.error("[v0] Failed to get cartridge level:", error)
    }

    // Get CPU temperature
    const cpuTemp = await getCPUTemperature()

    return {
      connected: printerState.connected,
      cartridgeLevel: printerState.cartridgeLevel || 0,
      cpuTemperature: cpuTemp,
      printing: printerState.printing,
      error: null,
    }
  } catch (error) {
    console.error("[v0] Get status error:", error)
    return {
      connected: false,
      cartridgeLevel: 0,
      cpuTemperature: 0,
      printing: false,
      error: "Failed to get status",
    }
  }
}

/**
 * Start printing
 */
export async function startPrinting() {
  try {
    const response = await sendCommand(0x11, "Start Printing")
    if (response.success) {
      printerState.printing = true
    }
    return { success: response.success }
  } catch (error) {
    console.error("[v0] Start printing error:", error)
    return { success: false, error: "Failed to start printing" }
  }
}

/**
 * Stop printing
 */
export async function stopPrinting() {
  try {
    console.log("[v0] Stopping printing...")
    const response = await sendCommand(0x12, "停止喷印")
    console.log("[v0] Stop response:", response)

    if (response.success) {
      printerState.printing = false
      console.log("[v0] Printing stopped successfully")
    }
    return { success: response.success }
  } catch (error) {
    console.error("[v0] Stop printing error:", error)
    return { success: false, error: `停止喷印失败: ${error}` }
  }
}

/**
 * Connect printer manually
 */
export async function connectPrinter() {
  try {
    const connection = initTCPConnection()
    if (connection) {
      await sendCommand(0x00, "握手通信")
      printerState.connected = true
      return { success: true }
    }
    return { success: false, error: "Failed to initialize connection" }
  } catch (error) {
    console.error("[v0] Connect error:", error)
    printerState.connected = false
    return { success: false, error: "Connection failed" }
  }
}

export async function disconnectPrinter() {
  try {
    if (tcpClient) {
      tcpClient.removeAllListeners()
      tcpClient.destroy()
      tcpClient = null
    }
    printerState.connected = false
    printerState.printing = false
    console.log("[v0] Printer disconnected successfully")
    return { success: true }
  } catch (error) {
    console.error("[v0] Disconnect error:", error)
    return { success: false, error: "Disconnect failed" }
  }
}

/**
 * Execute a debug command
 */
export async function executeDebugCommand(commandId: number, params: any = {}) {
  try {
    // Build data buffer based on command and params
    let data = Buffer.alloc(0)

    // Handle common parameter patterns
    if (params.head) {
      data = Buffer.concat([data, Buffer.from([Number.parseInt(params.head)])])
    }
    if (params.value !== undefined) {
      data = Buffer.concat([data, Buffer.from([Number.parseInt(params.value)])])
    }

    const response = await sendCommand(
      commandId,
      COMMAND_NAME_MAP[commandId] || `命令 0x${commandId.toString(16)}`,
      data,
    )
    return { success: response.success, data: response.data, statusText: response.statusText }
  } catch (error) {
    console.error("[v0] Debug command error:", error)
    return { success: false, error: "Command execution failed" }
  }
}

/**
 * Send QR code print command
 */
export async function sendQRCodePrint(url: string, quantity: number, size = 3, x = 0, y = 0, errorLevel = "L") {
  try {
    console.log("[v0] Starting QR code print:", { url, quantity, size, x, y, errorLevel })

    if (!url || url.trim() === "") {
      console.error("[v0] URL is empty")
      return { success: false, error: "URL不能为空" }
    }

    const qrData = buildQRCodeData(url, size, x, y, errorLevel)
    console.log("[v0] Built QR module data (hex):", qrData.toString("hex").toUpperCase())
    console.log("[v0] QR module data length:", qrData.length)

    // Send information file (command 0x1C)
    const infoName = "QR"
    const infoNameBuf = Buffer.from(infoName, "utf8")

    const dataContent = Buffer.concat([
      Buffer.from([infoNameBuf.length]), // 信息名称字节数
      infoNameBuf, // 信息名称
      Buffer.from([0x01]), // 模块总数 (1个二维码模块)
      qrData, // 二维码模块数据
    ])

    // 数据长度 = dataContent的长度（3字节，大端序）
    // 注意：数据长度字段本身不计入长度值中
    const dataLength = Buffer.alloc(3)
    dataLength.writeUIntBE(dataContent.length, 0, 3)

    const fullData = Buffer.concat([dataLength, dataContent])

    console.log("[v0] === QR Code Data Breakdown ===")
    console.log("[v0] Data length (3 bytes):", dataLength.toString("hex").toUpperCase(), "=", dataContent.length)
    console.log("[v0] Info name length:", infoNameBuf.length)
    console.log("[v0] Info name:", infoName)
    console.log("[v0] Module count: 1")
    console.log("[v0] Module data length:", qrData.length)
    console.log("[v0] Full data (hex):", fullData.toString("hex").toUpperCase())
    console.log("[v0] Full data length:", fullData.length)

    // Send the information file
    const infoResult = await sendCommand(0x1c, "发送信息文件", fullData)
    console.log("[v0] Info file send result:", infoResult)

    if (!infoResult.success) {
      return { success: false, error: `发送信息文件失败: 状态码 0x${infoResult.statusCode.toString(16)}` }
    }

    // Wait a bit for the printer to process
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Send print command (command 0x01) to update print content
    const printResult = await sendCommand(0x01, "发送打印")
    console.log("[v0] Print command result:", printResult)

    console.log("[v0] QR code sent successfully, quantity:", quantity)

    return { success: true }
  } catch (error) {
    console.error("[v0] QR code print error:", error)
    return { success: false, error: `打印二维码失败: ${error}` }
  }
}

/**
 * Build QR code module data according to protocol 3.5.20.5
 */
function buildQRCodeData(content: string, size: number, x: number, y: number, errorLevel: string): Buffer {
  const contentBuf = Buffer.from(content, "utf8")

  console.log("[v0] Building QR Code Data:")
  console.log(`[v0]   Content: ${content}`)
  console.log(`[v0]   Size: ${size}`)
  console.log(`[v0]   Position: (${x}, ${y})`)
  console.log(`[v0]   Error Level: ${errorLevel}`)

  // 二维码模块结构 (根据协议文档 3.5.20.5)
  const moduleType = Buffer.from([0x04]) // 模块类型: 04 = 二维码

  // X/Y坐标 (2字节，大端序)
  const xCoord = Buffer.alloc(2)
  xCoord.writeUInt16BE(x & 0x7fff) // bit15=0表示正数
  const yCoord = Buffer.alloc(2)
  yCoord.writeUInt16BE(y & 0x7fff)

  // 线条宽度 (1字节，范围03-0F)
  const lineWidth = Buffer.from([Math.max(3, Math.min(15, size))])

  // 条码类型(高4位) + 容错级别(低4位) (1字节)
  // 条码类型: 0=QRcode
  // 容错级别: 0=L, 1=M, 2=Q, 3=H
  const errorLevelMap: Record<string, number> = { L: 0, M: 1, Q: 2, H: 3 }
  const errorLevelValue = errorLevelMap[errorLevel] || 3 // 默认使用H级别
  const codeTypeByte = (0 << 4) | errorLevelValue
  const codeType = Buffer.from([codeTypeByte])

  console.log(`[v0]   Line Width: 0x${lineWidth[0].toString(16).padStart(2, "0")}`)
  console.log(
    `[v0]   Code Type Byte: 0x${codeTypeByte.toString(16).padStart(2, "0")} (Type: 0, Error Level: ${errorLevelValue})`,
  )

  // 条码尺寸 (1字节，00=Auto)
  const codeSize = Buffer.from([0x00])

  // 条码方向(高4位) + 反色选择(低4位) (1字节)
  // 方向: 0=0°
  // 反色: 0=正常
  const direction = Buffer.from([0x00])

  // 边框样式(高4位) + 边框尺寸(低4位) (1字节)
  // 样式: 0=无边框
  // 尺寸: 0
  const border = Buffer.from([0x00])

  // 插入子模块数 (1字节)
  const subModuleCount = Buffer.from([0x01]) // 1个子模块

  // 子文本模块 (子模块类型01)
  const subModuleType = Buffer.from([0x01]) // 类型01 = 文本
  const textLength = Buffer.from([contentBuf.length]) // 文本字节数

  console.log(`[v0]   Sub Module Type: 0x${subModuleType[0].toString(16).padStart(2, "0")}`)
  console.log(`[v0]   Text Length: ${contentBuf.length}`)
  console.log(`[v0]   Content Hex: ${contentBuf.toString("hex")}`)

  const result = Buffer.concat([
    moduleType,
    xCoord,
    yCoord,
    lineWidth,
    codeType,
    codeSize,
    direction,
    border,
    subModuleCount,
    subModuleType,
    textLength,
    contentBuf,
  ])

  console.log(`[v0]   Final QR Module Data (hex): ${result.toString("hex")}`)
  console.log(`[v0]   Final QR Module Data (length): ${result.length} bytes`)

  return result
}

/**
 * Send text print command
 */
export async function sendTextPrint(content: string, fontSize = 24, x = 0, y = 0, rotation = 0) {
  try {
    console.log("[v0] Starting text print:", { content, fontSize, x, y, rotation })

    if (!content || content.trim() === "") {
      console.error("[v0] Text content is empty")
      return { success: false, error: "文本内容不能为空" }
    }

    const textData = buildTextData(content, fontSize, x, y, rotation)
    console.log("[v0] Built text module data (hex):", textData.toString("hex").toUpperCase())
    console.log("[v0] Text module data length:", textData.length)

    // Send information file (command 0x1C)
    const infoName = "TXT"
    const infoNameBuf = Buffer.from(infoName, "utf8")

    const dataContent = Buffer.concat([
      Buffer.from([infoNameBuf.length]), // 信息名称字节数
      infoNameBuf, // 信息名称
      Buffer.from([0x01]), // 模块总数 (1个文本模块)
      textData, // 文本模块数据
    ])

    // 数据长度 = dataContent的长度（3字节，大端序）
    const dataLength = Buffer.alloc(3)
    dataLength.writeUIntBE(dataContent.length, 0, 3)

    const fullData = Buffer.concat([dataLength, dataContent])

    console.log("[v0] === Text Data Breakdown ===")
    console.log("[v0] Data length (3 bytes):", dataLength.toString("hex").toUpperCase(), "=", dataContent.length)
    console.log("[v0] Info name length:", infoNameBuf.length)
    console.log("[v0] Info name:", infoName)
    console.log("[v0] Module count: 1")
    console.log("[v0] Module data length:", textData.length)
    console.log("[v0] Full data (hex):", fullData.toString("hex").toUpperCase())
    console.log("[v0] Full data length:", fullData.length)

    // Send the information file
    const infoResult = await sendCommand(0x1c, "发送信息文件", fullData)
    console.log("[v0] Info file send result:", infoResult)

    if (!infoResult.success) {
      return { success: false, error: `发送信息文件失败: 状态码 0x${infoResult.statusCode.toString(16)}` }
    }

    // Wait a bit for the printer to process
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Send print command (command 0x01) to update print content
    const printResult = await sendCommand(0x01, "发送打印")
    console.log("[v0] Print command result:", printResult)

    console.log("[v0] Text sent successfully")

    return { success: true }
  } catch (error) {
    console.error("[v0] Text print error:", error)
    return { success: false, error: `打印文本失败: ${error}` }
  }
}

/**
 * Build text module data according to protocol 3.5.20.2
 */
function buildTextData(content: string, fontSize: number, x: number, y: number, rotation: number): Buffer {
  const contentBuf = Buffer.from(content, "utf8")

  // 文本模块结构 (根据协议文档 3.5.20.2)
  const moduleType = Buffer.from([0x01]) // 模块类型: 01 = 文本

  // X/Y坐标 (2字节，大端序)
  const xCoord = Buffer.alloc(2)
  xCoord.writeUInt16BE(x & 0x7fff) // bit15=0表示正数
  const yCoord = Buffer.alloc(2)
  yCoord.writeUInt16BE(y & 0x7fff)

  // 设置方向 (2字节，0-359度)
  const directionBuf = Buffer.alloc(2)
  directionBuf.writeUInt16BE(rotation % 360)

  // 调整间距 (1字节，05=默认值0)
  const spacing = Buffer.from([0x05])

  // 字体大小 (2字节，范围5-1200)
  const fontSizeBuf = Buffer.alloc(2)
  fontSizeBuf.writeUInt16BE(Math.max(5, Math.min(1200, fontSize)))

  // 字体名 (使用默认字体"Arial")
  const fontName = Buffer.from("Arial", "utf8")
  const fontNameLength = Buffer.from([fontName.length])

  // 文本字节数 (1字节，最大64)
  const textLength = Buffer.from([Math.min(contentBuf.length, 64)])
  const textContent = contentBuf.slice(0, 64) // 限制最大长度

  return Buffer.concat([
    moduleType,
    xCoord,
    yCoord,
    directionBuf,
    spacing,
    fontSizeBuf,
    fontNameLength,
    fontName,
    textLength,
    textContent,
  ])
}

/**
 * Get communication logs
 */
export function getCommunicationLogs() {
  return communicationLogs
}

/**
 * Get CPU temperature from Raspberry Pi
 */
async function getCPUTemperature(): Promise<number> {
  try {
    console.log("[v0] Attempting to read CPU temperature...")

    return new Promise((resolve) => {
      exec("cat /sys/class/thermal/thermal_zone0/temp", (error: any, stdout: string, stderr: string) => {
        if (error) {
          console.error("[v0] CPU temp read error:", error)
          console.error("[v0] stderr:", stderr)
          resolve(0)
          return
        }

        const rawOutput = stdout.trim()
        console.log("[v0] Raw CPU temp output:", rawOutput)

        const tempMillidegrees = Number.parseInt(rawOutput)
        if (isNaN(tempMillidegrees)) {
          console.error("[v0] Failed to parse temperature:", rawOutput)
          resolve(0)
          return
        }

        const tempCelsius = tempMillidegrees / 1000
        console.log("[v0] CPU Temperature:", tempCelsius, "°C")
        resolve(Math.round(tempCelsius * 10) / 10)
      })
    })
  } catch (error) {
    console.error("[v0] CPU temperature exception:", error)
    return 0
  }
}

/**
 * Trigger printing (simulate photoelectric signal)
 */
export async function triggerPrint() {
  return sendCommand(0x13, "触发喷印")
}
