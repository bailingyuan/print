"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Send, Play, Square, Type, QrCode } from "lucide-react"

interface ContentEditorProps {
  onPrint: (content: any) => Promise<void>
  isLoading: boolean
  connected: boolean
  onStartPrinting: () => Promise<void>
  onStopPrinting: () => Promise<void>
  onTriggerPrint: () => Promise<void>
  printing: boolean
}

export function ContentEditor({
  onPrint,
  isLoading,
  connected,
  onStartPrinting,
  onStopPrinting,
  onTriggerPrint,
  printing,
}: ContentEditorProps) {
  const [contentType, setContentType] = useState<"qrcode" | "text">("qrcode")

  // QR Code settings - 使用图案模块只需要基础参数
  const [qrUrl, setQrUrl] = useState("")
  const [qrQuantity, setQrQuantity] = useState("1")
  const [qrSize, setQrSize] = useState("3") // 1-5 映射到放大倍数
  const [qrX, setQrX] = useState("0")
  const [qrY, setQrY] = useState("0")
  const [qrInverse, setQrInverse] = useState(false) // 是否反色

  // Text settings
  const [textContent, setTextContent] = useState("")
  const [textSize, setTextSize] = useState("24")
  const [textX, setTextX] = useState("0")
  const [textY, setTextY] = useState("0")
  const [textRotation, setTextRotation] = useState("0")

  const handlePrint = async () => {
    if (contentType === "qrcode") {
      await onPrint({
        type: "qrcode",
        url: qrUrl,
        quantity: Number.parseInt(qrQuantity),
        size: Number.parseInt(qrSize), // 用于计算放大倍数
        x: Number.parseInt(qrX),
        y: Number.parseInt(qrY),
        inverse: qrInverse,
      })
    } else {
      await onPrint({
        type: "text",
        content: textContent,
        size: Number.parseInt(textSize),
        x: Number.parseInt(textX),
        y: Number.parseInt(textY),
        rotation: Number.parseInt(textRotation),
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>内容设置</CardTitle>
        <CardDescription>设置打印内容、位置、大小等参数</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={contentType} onValueChange={(v) => setContentType(v as "qrcode" | "text")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="qrcode">
              <QrCode className="mr-2 h-4 w-4" />
              二维码
            </TabsTrigger>
            <TabsTrigger value="text">
              <Type className="mr-2 h-4 w-4" />
              文本
            </TabsTrigger>
          </TabsList>

          <TabsContent value="qrcode" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="qr-url">URL链接</Label>
              <Input
                id="qr-url"
                placeholder="https://example.com"
                value={qrUrl}
                onChange={(e) => setQrUrl(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qr-quantity">打印数量</Label>
                <Input
                  id="qr-quantity"
                  type="number"
                  min="1"
                  value={qrQuantity}
                  onChange={(e) => setQrQuantity(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="qr-size">二维码大小</Label>
                <Select value={qrSize} onValueChange={setQrSize}>
                  <SelectTrigger id="qr-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">很小 (1x)</SelectItem>
                    <SelectItem value="2">小 (2x)</SelectItem>
                    <SelectItem value="3">中 (3x)</SelectItem>
                    <SelectItem value="4">大 (4x)</SelectItem>
                    <SelectItem value="5">很大 (5x)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qr-x">X坐标 (像素)</Label>
                <Input id="qr-x" type="number" value={qrX} onChange={(e) => setQrX(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="qr-y">Y坐标 (像素)</Label>
                <Input id="qr-y" type="number" value={qrY} onChange={(e) => setQrY(e.target.value)} />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="qr-inverse"
                checked={qrInverse}
                onChange={(e) => setQrInverse(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="qr-inverse">反色打印（黑白反转）</Label>
            </div>
          </TabsContent>

          <TabsContent value="text" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="text-content">文本内容</Label>
              <Textarea
                id="text-content"
                placeholder="输入要打印的文本内容"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="text-size">字体大小</Label>
                <Input
                  id="text-size"
                  type="number"
                  min="5"
                  max="400"
                  value={textSize}
                  onChange={(e) => setTextSize(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="text-rotation">旋转角度</Label>
                <Select value={textRotation} onValueChange={setTextRotation}>
                  <SelectTrigger id="text-rotation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0°</SelectItem>
                    <SelectItem value="90">90°</SelectItem>
                    <SelectItem value="180">180°</SelectItem>
                    <SelectItem value="270">270°</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="text-x">X坐标</Label>
                <Input id="text-x" type="number" value={textX} onChange={(e) => setTextX(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="text-y">Y坐标</Label>
                <Input id="text-y" type="number" value={textY} onChange={(e) => setTextY(e.target.value)} />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Button
          className="w-full"
          onClick={handlePrint}
          disabled={isLoading || !connected || (contentType === "qrcode" ? !qrUrl : !textContent)}
        >
          <Send className="mr-2 h-4 w-4" />
          {isLoading ? "发送中..." : "发送打印"}
        </Button>

        <Separator />

        <div className="space-y-2">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={onStartPrinting} disabled={!connected}>
              <Play className="mr-2 h-4 w-4" />
              启动喷印
            </Button>
            <Button variant="outline" className="flex-1 bg-transparent" onClick={onStopPrinting} disabled={!connected}>
              <Square className="mr-2 h-4 w-4" />
              停止喷印
            </Button>
          </div>
        </div>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="text-xs space-y-1 pt-3 text-muted-foreground">
            <p className="font-medium text-blue-900 mb-2">打印流程:</p>
            <p>1. 设置内容并点击"发送打印"上传到喷码机</p>
            <p>2. 点击"启动喷印"启动喷码机</p>
            <p>3. 喷码机将自动检测并打印二维码/文本</p>
            <p className="mt-2 pt-2 border-t border-blue-200">
              <span className="font-medium">二维码参数说明:</span>
            </p>
            <p>• 二维码大小: 1x-5x 放大倍数，控制二维码整体尺寸</p>
            <p>• X/Y坐标: 二维码左上角在打印区域的位置（像素）</p>
            <p>• 反色打印: 勾选后黑白反转，适用于深色材质</p>
            <p className="mt-1 text-blue-700 font-medium">注意: 使用图案模块发送，自动生成标准二维码图案</p>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}
