import { NextResponse } from "next/server"
import { getCommunicationLogs } from "@/lib/printer"

export async function GET() {
  try {
    const logs = await getCommunicationLogs()
    return NextResponse.json(logs)
  } catch (error) {
    console.error("[v0] Failed to get logs:", error)
    return NextResponse.json([], { status: 500 })
  }
}
