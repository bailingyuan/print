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
import { QRPreview } from "./qr-preview"

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

  // QR Code settings
  const [qrUrl, setQrUrl] = useState("")
  const [qrQuantity, setQrQuantity] = useState("1")
  const [qrSize, setQrSize] = useState("3")
  const [qrErrorLevel, setQrErrorLevel] = useState<"L" | "M" | "Q" | "H">("H")
  const [qrX, setQrX] = useState("0")
  const [qrY, setQrY] = useState("0")
  const [qrCodeType, setQrCodeType] = useState("0") // 条码类型
  const [qrCodeSize, setQrCodeSize] = useState("0") // 条码尺寸
  const [qrRotation, setQrRotation] = useState("0") // 旋转角度
  const [qrInverse, setQrInverse] = useState(false) // 是否反色
  const [qrBorderStyle, setQrBorderStyle] = useState("0") // 边框样式
  const [qrBorderSize, setQrBorderSize] = useState("0") // 边框尺寸

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
        size: Number.parseInt(qrSize),
        errorLevel: qrErrorLevel,
        x: Number.parseInt(qrX),
        y: Number.parseInt(qrY),
        codeType: Number.parseInt(qrCodeType),
        codeSize: Number.parseInt(qrCodeSize),
        rotation: Number.parseInt(qrRotation),
        inverse: qrInverse,
        borderStyle: Number.parseInt(qrBorderStyle),
        borderSize: Number.parseInt(qrBorderSize),
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
            <QRPreview content={qrUrl} size={Number.parseInt(qrSize)} errorLevel={qrErrorLevel} inverse={qrInverse} />

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
                <Label htmlFor="qr-size">线条宽度</Label>
                <Select value={qrSize} onValueChange={setQrSize}>
                  <SelectTrigger id="qr-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">5 (最小)</SelectItem>
                    <SelectItem value="2">6 (小)</SelectItem>
                    <SelectItem value="3">7 (中)</SelectItem>
                    <SelectItem value="4">8 (大)</SelectItem>
                    <SelectItem value="5">9 (最大)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qr-code-type">条码类型</Label>
                <Select value={qrCodeType} onValueChange={setQrCodeType}>
                  <SelectTrigger id="qr-code-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">QRcode</SelectItem>
                    <SelectItem value="1">Data Matrix</SelectItem>
                    <SelectItem value="2">Micro QRcode</SelectItem>
                    <SelectItem value="3">PDF417</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="qr-code-size">条码尺寸</Label>
                <Select value={qrCodeSize} onValueChange={setQrCodeSize}>
                  <SelectTrigger id="qr-code-size">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Auto</SelectItem>
                    <SelectItem value="1">21x21</SelectItem>
                    <SelectItem value="2">25x25</SelectItem>
                    <SelectItem value="3">29x29</SelectItem>
                    <SelectItem value="4">33x33</SelectItem>
                    <SelectItem value="5">37x37</SelectItem>
                    <SelectItem value="6">41x41</SelectItem>
                    <SelectItem value="7">45x45</SelectItem>
                    <SelectItem value="8">49x49</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qr-x">X坐标</Label>
                <Input id="qr-x" type="number" value={qrX} onChange={(e) => setQrX(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="qr-y">Y坐标</Label>
                <Input id="qr-y" type="number" value={qrY} onChange={(e) => setQrY(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="qr-error">容错级别</Label>
                <Select value={qrErrorLevel} onValueChange={(v) => setQrErrorLevel(v as "L" | "M" | "Q" | "H")}>
                  <SelectTrigger id="qr-error">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">L (7%)</SelectItem>
                    <SelectItem value="M">M (15%)</SelectItem>
                    <SelectItem value="Q">Q (25%)</SelectItem>
                    <SelectItem value="H">H (30%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qr-rotation">旋转角度</Label>
                <Select value={qrRotation} onValueChange={setQrRotation}>
                  <SelectTrigger id="qr-rotation">
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

              <div className="space-y-2">
                <Label htmlFor="qr-border-style">边框样式</Label>
                <Select value={qrBorderStyle} onValueChange={setQrBorderStyle}>
                  <SelectTrigger id="qr-border-style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">无边框</SelectItem>
                    <SelectItem value="1">上下边框</SelectItem>
                    <SelectItem value="2">四周边框</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="qr-border-size">边框尺寸 (0-15)</Label>
                <Input
                  id="qr-border-size"
                  type="number"
                  min="0"
                  max="15"
                  value={qrBorderSize}
                  onChange={(e) => setQrBorderSize(e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="qr-inverse"
                  checked={qrInverse}
                  onChange={(e) => setQrInverse(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="qr-inverse">反色打印</Label>
              </div>
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
            <p>3. 点击"触发喷印"执行实际打印动作</p>
            <p className="mt-2 pt-2 border-t border-blue-200">
              <span className="font-medium">二维码参数说明:</span>
            </p>
            <p>• 线条宽度: 5-9，控制二维码单元格粗细</p>
            <p>• 条码类型: QRcode/DataMatrix等不同二维码标准</p>
            <p>• 条码尺寸: Auto自动或指定21x21到49x49等尺寸</p>
            <p>
              • 容错级别: L(7%) {"<"} M(15%) {"<"} Q(25%) {"<"} H(30%)
            </p>
            <p>• 边框样式: 无边框/上下边框/四周边框</p>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}
