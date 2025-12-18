import { NextResponse } from "next/server"
import { startPrinting } from "@/lib/printer"

export async function POST() {
  try {
    const result = await startPrinting()
    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Start printing error:", error)
    return NextResponse.json({ success: false, error: "Failed to start printing" }, { status: 500 })
  }
}
