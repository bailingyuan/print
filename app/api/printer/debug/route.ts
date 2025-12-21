import { type NextRequest, NextResponse } from "next/server"
import { executeDebugCommand } from "@/lib/printer"

export async function POST(request: NextRequest) {
  try {
    const { commandId, data } = await request.json()
    const result = await executeDebugCommand(commandId, data)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
