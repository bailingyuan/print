import { NextResponse } from "next/server"
import { triggerPrint } from "@/lib/printer"

export async function POST() {
  try {
    const result = await triggerPrint()

    if (!result.success) {
      return NextResponse.json({ success: false, error: "触发喷印失败", details: result }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "触发喷印成功",
      result,
    })
  } catch (error: any) {
    console.error("[v0] Trigger print error:", error)
    return NextResponse.json({ success: false, error: error.message || "触发喷印失败" }, { status: 500 })
  }
}
