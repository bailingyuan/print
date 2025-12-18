import * as net from "net"

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
}

let connectionConfig: ConnectionConfig = {
  tcp: {
    host: "192.168.1.100",
    port: 9100,
  },
}

let tcpClient: net.Socket | null = null

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
function initTCPConnection(): net.Socket | null {
  if (tcpClient && !tcpClient.destroyed) {
    return tcpClient
  }

  try {
    tcpClient = new net.Socket()

    tcpClient.connect(connectionConfig.tcp.port, connectionConfig.tcp.host, () => {
      console.log("TCP connection established")
      printerState.connected = true
    })

    tcpClient.on("error", (err) => {
      console.error("TCP error:", err)
      printerState.connected = false
    })

    tcpClient.on("close", () => {
      console.log("TCP connection closed")
      printerState.connected = false
    })

    return tcpClient
  } catch (error) {
    console.error("Failed to initialize TCP connection:", error)
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
 * Build command packet
 */
function buildCommand(commandId: number, data: Buffer = Buffer.alloc(0)): Buffer {
  const header = Buffer.from([0x1b, 0x02, 0x00, commandId])
  const footer = Buffer.from([0x1b, 0x03])

  const packet = Buffer.concat([header, data, footer])
  const checksum = calculateChecksum(packet)

  return Buffer.concat([packet, Buffer.from([checksum])])
}

/**
 * Parse response packet
 */
function parseResponse(response: Buffer): {
  machineNumber: number
  statusCode: number
  commandId: number
  data: Buffer
} {
  if (response[0] !== 0x1b || (response[1] !== 0x06 && response[1] !== 0x15)) {
    throw new Error("Invalid response format")
  }

  const machineNumber = response[2]
  const statusCode = response[3]
  const commandId = response[4]
  const data = response.slice(5, response.length - 3)

  return { machineNumber, statusCode, commandId, data }
}

/**
 * Send command and wait for response
 */
async function sendCommand(
  commandId: number,
  commandName: string,
  data: Buffer = Buffer.alloc(0),
): Promise<{ success: boolean; statusCode: number; data: Buffer }> {
  return new Promise(async (resolve, reject) => {
    const connection = initTCPConnection()

    if (!connection) {
      reject(new Error("TCP connection not available"))
      return
    }

    const command = buildCommand(commandId, data)

    // Log sent command
    addLog({
      direction: "send",
      commandId: `0x${commandId.toString(16).toUpperCase().padStart(2, "0")}`,
      commandName,
      data: data.toString("utf8"),
      rawHex: command.toString("hex").toUpperCase(),
    })

    connection.write(command)

    // Wait for response
    const timeout = setTimeout(() => {
      reject(new Error("Response timeout"))
    }, 5000)

    const handleData = (response: Buffer) => {
      clearTimeout(timeout)

      // Log received response
      addLog({
        direction: "receive",
        commandId: `0x${commandId.toString(16).toUpperCase().padStart(2, "0")}`,
        commandName: `${commandName} Response`,
        data: response.slice(5, response.length - 3).toString("utf8"),
        rawHex: response.toString("hex").toUpperCase(),
      })

      try {
        const parsed = parseResponse(response)
        resolve({
          success: parsed.statusCode === 0x00,
          statusCode: parsed.statusCode,
          data: parsed.data,
        })
      } catch (error) {
        reject(error)
      }
    }

    // TCP data handling
    connection.once("data", handleData)
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
    const { exec } = require("child_process")
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
    const response = await sendCommand(0x12, "Stop Printing")
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
