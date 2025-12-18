import { NextResponse } from "next/server"
import { getPrinterStatus } from "@/lib/printer"

export async function GET() {
  try {
    const status = await getPrinterStatus()
    return NextResponse.json(status)
  } catch (error) {
    console.error("[v0] Failed to get printer status:", error)
    return NextResponse.json(
      {
        connected: false,
        cartridgeLevel: 0,
        cpuTemperature: 0,
        printing: false,
        error: "Failed to get status",
      },
      { status: 500 },
    )
  }
}
