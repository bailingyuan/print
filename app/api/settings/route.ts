import { type NextRequest, NextResponse } from "next/server"
import { updateConnectionConfig, getConnectionConfig } from "@/lib/printer"
import { updateStepperConfig, getStepperConfig } from "@/lib/stepper"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Update printer connection config
    updateConnectionConfig({
      type: body.connectionType,
      serial: {
        path: body.serialPort,
        baudRate: body.serialBaudRate,
      },
      tcp: {
        host: body.tcpHost,
        port: body.tcpPort,
      },
    })

    // Update stepper motor config
    updateStepperConfig({
      dirPin: body.stepperDirPin,
      stepPin: body.stepperStepPin,
      enablePin: body.stepperEnablePin,
    })

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
    })
  } catch (error) {
    console.error("[v0] Settings update error:", error)
    return NextResponse.json({ success: false, error: "Failed to update settings" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const connectionConfig = getConnectionConfig()
    const stepperConfig = getStepperConfig()

    return NextResponse.json({
      connectionType: connectionConfig.type,
      serialPort: connectionConfig.serial?.path,
      serialBaudRate: connectionConfig.serial?.baudRate,
      tcpHost: connectionConfig.tcp?.host,
      tcpPort: connectionConfig.tcp?.port,
      stepperDirPin: stepperConfig.dirPin,
      stepperStepPin: stepperConfig.stepPin,
      stepperEnablePin: stepperConfig.enablePin,
    })
  } catch (error) {
    console.error("[v0] Get settings error:", error)
    return NextResponse.json({ error: "Failed to get settings" }, { status: 500 })
  }
}
