import { type NextRequest, NextResponse } from "next/server"
import { connectPrinter, updateConnectionConfig } from "@/lib/printer"

export async function POST(request: NextRequest) {
  try {
    const config = await request.json()

    // Update connection config
    updateConnectionConfig({
      tcp: {
        host: config.tcpHost,
        port: config.tcpPort,
      },
      machineNumber: config.machineNumber,
    })

    // Connect to printer
    const result = await connectPrinter()

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
