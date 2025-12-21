import { NextResponse } from "next/server"
import { disconnectPrinter } from "@/lib/printer"

export async function POST() {
  try {
    const result = await disconnectPrinter()
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
