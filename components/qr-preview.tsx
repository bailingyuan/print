"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import QRCode from "qrcode"

interface QRPreviewProps {
  content: string
  size: number
  errorLevel: "L" | "M" | "Q" | "H"
  inverse: boolean
}

export function QRPreview({ content, size, errorLevel, inverse }: QRPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !content) return

    const canvas = canvasRef.current
    const displaySize = 200 // 显示尺寸200x200像素

    QRCode.toCanvas(
      canvas,
      content,
      {
        width: displaySize,
        margin: 2,
        errorCorrectionLevel: errorLevel,
        color: {
          dark: inverse ? "#ffffff" : "#000000",
          light: inverse ? "#000000" : "#ffffff",
        },
      },
      (error) => {
        if (error) console.error("[v0] QR Preview error:", error)
      },
    )
  }, [content, size, errorLevel, inverse])

  if (!content) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">二维码预览</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[220px] text-muted-foreground text-sm">
          请输入URL链接以预览二维码
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">二维码预览</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-2">
        <canvas ref={canvasRef} className="border rounded" />
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>容错级别: {errorLevel}</p>
          <p>线条宽度: {size}</p>
          <p>反色: {inverse ? "是" : "否"}</p>
          <p className="text-[10px] mt-2 max-w-[200px] break-all">{content}</p>
        </div>
      </CardContent>
    </Card>
  )
}
