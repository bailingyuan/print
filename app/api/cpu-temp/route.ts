import { NextResponse } from "next/server"

/**
 * Get CPU temperature - standalone endpoint for testing
 */
export async function GET() {
  try {
    const { exec } = require("child_process")

    return new Promise((resolve) => {
      exec("cat /sys/class/thermal/thermal_zone0/temp", (error: any, stdout: string, stderr: string) => {
        if (error) {
          console.error("[v0] CPU temp error:", error)
          resolve(
            NextResponse.json(
              {
                error: error.message,
                stderr,
                temperature: 0,
              },
              { status: 500 },
            ),
          )
          return
        }

        const rawOutput = stdout.trim()
        const tempMillidegrees = Number.parseInt(rawOutput)

        if (isNaN(tempMillidegrees)) {
          resolve(
            NextResponse.json(
              {
                error: "Failed to parse temperature",
                raw: rawOutput,
                temperature: 0,
              },
              { status: 500 },
            ),
          )
          return
        }

        const tempCelsius = tempMillidegrees / 1000

        resolve(
          NextResponse.json({
            temperature: Math.round(tempCelsius * 10) / 10,
            raw: rawOutput,
            millidegrees: tempMillidegrees,
          }),
        )
      })
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message,
        temperature: 0,
      },
      { status: 500 },
    )
  }
}
