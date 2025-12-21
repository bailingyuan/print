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
function buildCommand(commandId: number, data: Buffer = Buffer.alloc(0)): Buffer {
  const header = Buffer.from([0x1b, 0x02, connectionConfig.machineNumber, commandId])
  const footer = Buffer.from([0x1b, 0x03])

  const packet = Buffer.concat([header, data, footer])
  const checksum = calculateChecksum(packet)

  return Buffer.concat([packet, Buffer.from([checksum])])
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
 * Get printer status
 */
export async function getPrinterStatus() {
  try {
    // Get cartridge level (command 0x26)
    const cartridgeResponse = await sendCommand(0x26, "Get Cartridge Level")
    const cartridgeLevel = cartridgeResponse.data.readUInt8(0)

    // Get CPU temperature
    const cpuTemp = await getCPUTemperature()

    // Get alarm status (command 0x14)
    try {
      const alarmResponse = await sendCommand(0x14, "Get Alarm Status")
      printerState.connected = true
    } catch (error) {
      printerState.connected = false
    }

    return {
      connected: printerState.connected,
      cartridgeLevel: cartridgeLevel || 0,
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
    const response = await sendCommand(0x12, "停止喷印")
    if (response.success) {
      printerState.printing = false
    }
    return { success: response.success }
  } catch (error) {
    console.error("[v0] Stop printing error:", error)
    return { success: false, error: "Failed to stop printing" }
  }
}

/**
 * Connect printer manually
 */
export async function connectPrinter() {
  try {
    const connection = initTCPConnection()
    if (connection) {
      // Send handshake command
      await sendCommand(0x00, "握手通信")
      return { success: true }
    }
    return { success: false, error: "Failed to initialize connection" }
  } catch (error) {
    console.error("[v0] Connect error:", error)
    return { success: false, error: "Connection failed" }
  }
}

export async function disconnectPrinter() {
  try {
    if (tcpClient) {
      tcpClient.destroy()
      tcpClient = null
    }
    printerState.connected = false
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
export async function sendQRCodePrint(url: string, quantity: number) {
  try {
    // Build QR code module data according to protocol 3.5.20.5
    const qrData = buildQRCodeData(url)

    // Send information file (command 0x1C)
    const infoName = "QRCode"
    const infoNameBuf = Buffer.from(infoName, "utf8")

    const data = Buffer.concat([
      Buffer.from([infoNameBuf.length]), // Info name length
      infoNameBuf, // Info name
      Buffer.from([0x01]), // Module count (1 QR code module)
      qrData, // QR code module data
    ])

    // Add data length prefix (3 bytes)
    const dataLength = Buffer.alloc(3)
    dataLength.writeUIntBE(data.length, 0, 3)
    const fullData = Buffer.concat([dataLength, data])

    await sendCommand(0x1c, "Send QR Code Info", fullData)

    // Send print command (command 0x01)
    for (let i = 0; i < quantity; i++) {
      await sendCommand(0x01, "Send Print")
      // Trigger print (command 0x13)
      await sendCommand(0x13, "Trigger Print")
      // Small delay between prints
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] QR code print error:", error)
    return { success: false, error: "Failed to print QR code" }
  }
}

/**
 * Build QR code module data
 */
function buildQRCodeData(content: string): Buffer {
  const contentBuf = Buffer.from(content, "utf8")

  // QR code module structure according to protocol
  const moduleType = Buffer.from([0x04]) // QR code module type
  const xCoord = Buffer.from([0x00, 0x00]) // X coordinate
  const yCoord = Buffer.from([0x00, 0x00]) // Y coordinate
  const lineWidth = Buffer.from([0x03]) // Line width: 3
  const codeType = Buffer.from([0x00]) // QR code type (4 bits) + Error correction level (4 bits): QR + Level L
  const codeSize = Buffer.from([0x00]) // Auto size
  const direction = Buffer.from([0x00]) // 0° + no inversion
  const border = Buffer.from([0x00]) // No border

  // Sub-modules count (1 for simple text)
  const subModuleCount = Buffer.from([0x01])

  // Sub-module: Text
  const subModuleType = Buffer.from([0x01]) // Text type
  const textLength = Buffer.from([contentBuf.length])

  return Buffer.concat([
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
}

/**
 * Get communication logs
 */
export function getCommunicationLogs() {
  return communicationLogs
}
