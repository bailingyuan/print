import { NextResponse } from "next/server"
import { sendQRCodePrint, sendTextPrint } from "@/lib/printer"

export async function POST(request: Request) {
  try {
    const content = await request.json()
    console.log("[v0] Received print request:", content)

    if (content.type === "qrcode") {
      if (!content.url || !content.quantity) {
        return NextResponse.json(
          { success: false, error: "URL and quantity are required for QR code" },
          { status: 400 },
        )
      }

      const result = await sendQRCodePrint(
        content.url,
        content.quantity,
        content.size || 3,
        content.x || 0,
        content.y || 0,
        content.errorLevel || "L",
      )

      return NextResponse.json(result)
    } else if (content.type === "text") {
      if (!content.content) {
        return NextResponse.json({ success: false, error: "Text content is required" }, { status: 400 })
      }

      const result = await sendTextPrint(
        content.content,
        content.size || 24,
        content.x || 0,
        content.y || 0,
        content.rotation || 0,
      )

      return NextResponse.json(result)
    } else {
      return NextResponse.json({ success: false, error: "Invalid content type" }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] Print error:", error)
    return NextResponse.json({ success: false, error: "Failed to send print command" }, { status: 500 })
  }
}
