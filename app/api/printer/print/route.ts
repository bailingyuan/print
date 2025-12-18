import { NextResponse } from "next/server"
import { sendQRCodePrint } from "@/lib/printer"

export async function POST(request: Request) {
  try {
    const { url, quantity } = await request.json()

    if (!url || !quantity) {
      return NextResponse.json({ success: false, error: "URL and quantity are required" }, { status: 400 })
    }

    const result = await sendQRCodePrint(url, quantity)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Print error:", error)
    return NextResponse.json({ success: false, error: "Failed to send print command" }, { status: 500 })
  }
}
