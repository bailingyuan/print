import { NextResponse } from "next/server"
import { stopPrinting } from "@/lib/printer"

export async function POST() {
  try {
    const result = await stopPrinting()
    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Stop printing error:", error)
    return NextResponse.json({ success: false, error: "Failed to stop printing" }, { status: 500 })
  }
}
