"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Activity,
  Thermometer,
  Droplets,
  Printer,
  ArrowLeft,
  ArrowRight,
  Play,
  Square,
  AlertCircle,
  CheckCircle2,
  Send,
} from "lucide-react"
import { useSWR } from "@/lib/swr"

interface PrinterStatus {
  connected: boolean
  cartridgeLevel: number
  cpuTemperature: number
  printing: boolean
  error: string | null
}

interface CommunicationLog {
  id: string
  timestamp: string
  direction: "send" | "receive"
  commandId: string
  commandName: string
  data: string
  rawHex: string
}

export default function PrinterControlPage() {
  const [qrUrl, setQrUrl] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [railPosition, setRailPosition] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch printer status
  const { data: status } = useSWR<PrinterStatus>("/api/printer/status", {
    refreshInterval: 2000,
  })

  // Fetch communication logs
  const { data: logs, mutate: mutateLogs } = useSWR<CommunicationLog[]>("/api/printer/logs", {
    refreshInterval: 1000,
  })

  const handlePrint = async () => {
    if (!qrUrl || !quantity) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/printer/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: qrUrl,
          quantity: Number.parseInt(quantity),
        }),
      })

      const result = await response.json()
      if (result.success) {
        mutateLogs()
      }
    } catch (error) {
      console.error("[v0] Print error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRailMove = async (direction: "left" | "right") => {
    try {
      const response = await fetch("/api/stepper/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ direction, steps: 100 }),
      })

      const result = await response.json()
      if (result.success) {
        setRailPosition(result.position)
      }
    } catch (error) {
      console.error("[v0] Rail move error:", error)
    }
  }

  const handleStartPrinting = async () => {
    try {
      await fetch("/api/printer/start", { method: "POST" })
      mutateLogs()
    } catch (error) {
      console.error("[v0] Start printing error:", error)
    }
  }

  const handleStopPrinting = async () => {
    try {
      await fetch("/api/printer/stop", { method: "POST" })
      mutateLogs()
    } catch (error) {
      console.error("[v0] Stop printing error:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">喷码机控制系统</h1>
          <p className="text-muted-foreground">TIJ Printer Control System</p>
        </div>

        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">连接状态</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {status?.connected ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <Badge variant="default" className="bg-green-500">
                      已连接
                    </Badge>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <Badge variant="destructive">未连接</Badge>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">墨盒余量</CardTitle>
              <Droplets className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status?.cartridgeLevel || 0}%</div>
              <div className="mt-2 h-2 w-full rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${status?.cartridgeLevel || 0}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CPU温度</CardTitle>
              <Thermometer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status?.cpuTemperature || 0}°C</div>
              <p className="text-xs text-muted-foreground mt-1">
                {(status?.cpuTemperature || 0) > 70 ? "温度偏高" : "正常"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">打印状态</CardTitle>
              <Printer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {status?.printing ? (
                  <Badge variant="default" className="bg-green-500">
                    打印中
                  </Badge>
                ) : (
                  <Badge variant="secondary">待机</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Print Control */}
          <Card>
            <CardHeader>
              <CardTitle>二维码打印</CardTitle>
              <CardDescription>输入URL和数量生成二维码并打印</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="qr-url">URL链接</Label>
                <Input
                  id="qr-url"
                  placeholder="https://example.com"
                  value={qrUrl}
                  onChange={(e) => setQrUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">打印数量</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  placeholder="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                onClick={handlePrint}
                disabled={!qrUrl || !quantity || isLoading || !status?.connected}
              >
                <Send className="mr-2 h-4 w-4" />
                {isLoading ? "发送中..." : "发送打印"}
              </Button>

              <Separator />

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={handleStartPrinting}
                  disabled={status?.printing || !status?.connected}
                >
                  <Play className="mr-2 h-4 w-4" />
                  启动喷印
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={handleStopPrinting}
                  disabled={!status?.printing || !status?.connected}
                >
                  <Square className="mr-2 h-4 w-4" />
                  停止喷印
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stepper Motor Control */}
          <Card>
            <CardHeader>
              <CardTitle>导轨控制</CardTitle>
              <CardDescription>42步进电机导轨位置控制</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-center space-x-4">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleRailMove("left")}
                  disabled={!status?.connected}
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>

                <div className="text-center">
                  <div className="text-3xl font-bold">{railPosition}</div>
                  <div className="text-sm text-muted-foreground">当前位置</div>
                </div>

                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => handleRailMove("right")}
                  disabled={!status?.connected}
                >
                  <ArrowRight className="h-6 w-6" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label>位置指示器</Label>
                <div className="relative h-4 rounded-full bg-muted overflow-hidden">
                  <div
                    className="absolute h-full w-2 bg-blue-500 transition-all duration-300"
                    style={{
                      left: `${Math.max(0, Math.min(100, ((railPosition + 1000) / 2000) * 100))}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>左限位</span>
                  <span>中心</span>
                  <span>右限位</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Communication Logs */}
        <Card>
          <CardHeader>
            <CardTitle>通信日志</CardTitle>
            <CardDescription>实时显示与喷码机的通信记录</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {logs && logs.length > 0 ? (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className={`rounded-lg border p-4 ${
                      log.direction === "send" ? "bg-blue-50 border-blue-200" : "bg-green-50 border-green-200"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={log.direction === "send" ? "default" : "secondary"}
                          className={log.direction === "send" ? "bg-blue-500" : "bg-green-500"}
                        >
                          {log.direction === "send" ? "发送" : "接收"}
                        </Badge>
                        <span className="font-semibold">{log.commandName}</span>
                        <code className="text-xs bg-white px-2 py-1 rounded">ID: {log.commandId}</code>
                      </div>
                      <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                    </div>

                    <div className="grid gap-2 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">数据:</span>
                        <div className="mt-1 rounded bg-white p-2 font-mono text-xs break-all">
                          {log.data || "无数据"}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">原始HEX:</span>
                        <div className="mt-1 rounded bg-white p-2 font-mono text-xs break-all">{log.rawHex}</div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">暂无通信记录</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
