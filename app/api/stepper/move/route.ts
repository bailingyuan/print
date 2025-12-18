import { NextResponse } from "next/server"
import { moveRail } from "@/lib/stepper"

export async function POST(request: Request) {
  try {
    const { direction, steps } = await request.json()

    if (!direction || !steps) {
      return NextResponse.json({ success: false, error: "Direction and steps are required" }, { status: 400 })
    }

    const result = await moveRail(direction, steps)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Stepper move error:", error)
    return NextResponse.json({ success: false, error: "Failed to move rail" }, { status: 500 })
  }
}
