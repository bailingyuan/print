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
import { Send, Play, Square, Type, QrCode, Zap } from "lucide-react"

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
  const [qrErrorLevel, setQrErrorLevel] = useState("L")
  const [qrX, setQrX] = useState("0")
  const [qrY, setQrY] = useState("0")

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
                    <SelectItem value="1">小 (1)</SelectItem>
                    <SelectItem value="2">中 (2)</SelectItem>
                    <SelectItem value="3">大 (3)</SelectItem>
                    <SelectItem value="4">超大 (4)</SelectItem>
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
                <Select value={qrErrorLevel} onValueChange={setQrErrorLevel}>
                  <SelectTrigger id="qr-error">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">L (低)</SelectItem>
                    <SelectItem value="M">M (中)</SelectItem>
                    <SelectItem value="Q">Q (高)</SelectItem>
                    <SelectItem value="H">H (最高)</SelectItem>
                  </SelectContent>
                </Select>
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
            <Button
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={onStartPrinting}
              disabled={printing || !connected || isLoading}
            >
              <Play className="mr-2 h-4 w-4" />
              启动喷印
            </Button>
            <Button
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={onStopPrinting}
              disabled={!printing || !connected || isLoading}
            >
              <Square className="mr-2 h-4 w-4" />
              停止喷印
            </Button>
          </div>

          <Button
            variant="default"
            className="w-full"
            onClick={onTriggerPrint}
            disabled={!printing || !connected || isLoading}
          >
            <Zap className="mr-2 h-4 w-4" />
            触发喷印
          </Button>
        </div>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="text-xs space-y-1 pt-3 text-muted-foreground">
            <p className="font-medium text-blue-900 mb-2">打印流程:</p>
            <p>1. 设置内容并点击"发送打印"上传到喷码机</p>
            <p>2. 点击"启动喷印"启动喷码机</p>
            <p>3. 点击"触发喷印"执行实际打印动作</p>
            <p className="mt-2 pt-2 border-t border-blue-200">
              <span className="font-medium">参数说明:</span>
            </p>
            <p>• X/Y坐标: 设置内容在打印区域的位置 (像素)</p>
            <p>• 二维码大小: 1-4级别，数值越大二维码越大</p>
            <p>• 容错级别: L(7%) &lt; M(15%) &lt; Q(25%) &lt; H(30%)</p>
            <p>• 字体大小: 5-400范围，根据实际需求调整</p>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  )
}
