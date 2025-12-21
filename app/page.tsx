"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Bug } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  Wifi,
  WifiOff,
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
  parsed?: {
    header: string
    machineNumber: string
    statusCode?: string
    commandId: string
    data: string
    footer: string
    checksum: string
  }
  statusText?: string
}

interface PrinterConfig {
  tcpHost: string
  tcpPort: number
  machineNumber: number
  stepperDirPin: number
  stepperStepPin: number
  stepperEnablePin: number
}

export default function PrinterControlPage() {
  const [qrUrl, setQrUrl] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [railPosition, setRailPosition] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [debugOpen, setDebugOpen] = useState(false)

  const [config, setConfig] = useState<PrinterConfig>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("printerConfig")
      if (saved) {
        return JSON.parse(saved)
      }
    }
    return {
      tcpHost: "169.254.59.119",
      tcpPort: 139,
      machineNumber: 119,
      stepperDirPin: 20,
      stepperStepPin: 21,
      stepperEnablePin: 16,
    }
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("printerConfig", JSON.stringify(config))
    }
  }, [config])

  const { data: status, mutate: mutateStatus } = useSWR<PrinterStatus>("/api/printer/status", {
    refreshInterval: 2000,
  })

  const { data: logs, mutate: mutateLogs } = useSWR<CommunicationLog[]>("/api/printer/logs", {
    refreshInterval: 500,
    revalidateOnFocus: false,
  })

  const handleConnect = async () => {
    try {
      const response = await fetch("/api/printer/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
      const result = await response.json()
      if (result.success) {
        mutateStatus()
      }
    } catch (error) {
      console.error("[v0] Connect error:", error)
    }
  }

  const handleDisconnect = async () => {
    try {
      await fetch("/api/printer/disconnect", { method: "POST" })
      mutateStatus()
    } catch (error) {
      console.error("[v0] Disconnect error:", error)
    }
  }

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

  const handleSaveSettings = async () => {
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })

      if (response.ok) {
        setSettingsOpen(false)
        await handleDisconnect()
        await handleConnect()
      }
    } catch (error) {
      console.error("[v0] Save settings error:", error)
    }
  }

  const executeDebugCommand = async (commandId: number, data?: any) => {
    try {
      const response = await fetch("/api/printer/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commandId, data }),
      })
      const result = await response.json()
      mutateLogs()
      return result
    } catch (error) {
      console.error("[v0] Debug command error:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-center flex-1 space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">喷码机控制系统</h1>
            <p className="text-muted-foreground">TIJ Printer Control System</p>
          </div>

          <div className="flex gap-2">
            {/* Debug Panel Button */}
            <Dialog open={debugOpen} onOpenChange={setDebugOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Bug className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>调试面板</DialogTitle>
                  <DialogDescription>执行所有TIJ协议命令</DialogDescription>
                </DialogHeader>
                <DebugPanel onExecute={executeDebugCommand} />
              </DialogContent>
            </Dialog>

            {/* Settings Button */}
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>系统设置</DialogTitle>
                  <DialogDescription>配置喷码机连接和步进电机参数</DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  {/* Connection Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">喷码机TCP连接设置</h3>

                    <div className="space-y-2">
                      <Label htmlFor="tcp-host">IP地址</Label>
                      <Input
                        id="tcp-host"
                        placeholder="169.254.59.119"
                        value={config.tcpHost}
                        onChange={(e) => setConfig({ ...config, tcpHost: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tcp-port">端口</Label>
                      <Input
                        id="tcp-port"
                        type="number"
                        value={config.tcpPort}
                        onChange={(e) => setConfig({ ...config, tcpPort: Number.parseInt(e.target.value) })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="machine-number">机号</Label>
                      <Input
                        id="machine-number"
                        type="number"
                        value={config.machineNumber}
                        onChange={(e) => setConfig({ ...config, machineNumber: Number.parseInt(e.target.value) })}
                      />
                      <p className="text-xs text-muted-foreground">机号通常为IP地址最后一个字节的十进制值</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Stepper Motor Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">步进电机GPIO设置</h3>

                    <div className="space-y-2">
                      <Label htmlFor="dir-pin">方向控制引脚 (DIR)</Label>
                      <Input
                        id="dir-pin"
                        type="number"
                        value={config.stepperDirPin}
                        onChange={(e) => setConfig({ ...config, stepperDirPin: Number.parseInt(e.target.value) })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="step-pin">步进控制引脚 (STEP/PWM)</Label>
                      <Input
                        id="step-pin"
                        type="number"
                        value={config.stepperStepPin}
                        onChange={(e) => setConfig({ ...config, stepperStepPin: Number.parseInt(e.target.value) })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="enable-pin">使能引脚 (ENABLE)</Label>
                      <Input
                        id="enable-pin"
                        type="number"
                        value={config.stepperEnablePin}
                        onChange={(e) => setConfig({ ...config, stepperEnablePin: Number.parseInt(e.target.value) })}
                      />
                    </div>

                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm">
                      <p className="font-medium mb-2">引脚说明：</p>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                        <li>GND: 接地线，连接到树莓派的GND引脚</li>
                        <li>5V: 电源线，连接到树莓派的5V引脚</li>
                        <li>DIR: 方向控制，使用GPIO引脚</li>
                        <li>STEP: 步进信号，使用GPIO引脚（支持PWM）</li>
                        <li>ENABLE: 使能控制，使用GPIO引脚</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                      取消
                    </Button>
                    <Button onClick={handleSaveSettings}>保存设置</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">连接状态</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
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
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={handleConnect}
                  disabled={status?.connected}
                >
                  <Wifi className="mr-1 h-3 w-3" />
                  连接
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 bg-transparent"
                  onClick={handleDisconnect}
                  disabled={!status?.connected}
                >
                  <WifiOff className="mr-1 h-3 w-3" />
                  断开
                </Button>
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
            <CardDescription>实时显示与喷码机的通信记录，包含详细协议解析</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {logs && logs.length > 0 ? (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className={`rounded-lg border p-4 ${
                      log.direction === "send" ? "bg-blue-50 border-blue-200" : "bg-green-50 border-green-200"
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={log.direction === "send" ? "default" : "secondary"}
                          className={log.direction === "send" ? "bg-blue-500" : "bg-green-500"}
                        >
                          {log.direction === "send" ? "发送" : "接收"}
                        </Badge>
                        <span className="font-semibold text-base">{log.commandName}</span>
                        <code className="text-xs bg-white px-2 py-1 rounded border">{log.commandId}</code>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">{log.timestamp}</span>
                    </div>

                    {log.direction === "receive" && log.statusText && (
                      <div className="mb-3 p-2 bg-white rounded border">
                        <span className="text-xs font-medium text-muted-foreground">状态: </span>
                        <span
                          className={`text-sm font-semibold ${
                            log.statusText.includes("成功") ? "text-green-600" : "text-orange-600"
                          }`}
                        >
                          {log.statusText}
                        </span>
                      </div>
                    )}

                    {log.parsed && (
                      <div className="mb-3 space-y-2">
                        <div className="text-xs font-medium text-muted-foreground mb-2">协议解析:</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-white p-2 rounded border">
                            <span className="text-muted-foreground">报文头:</span>
                            <code className="ml-2 font-mono font-semibold">{log.parsed.header}</code>
                          </div>
                          <div className="bg-white p-2 rounded border">
                            <span className="text-muted-foreground">
                              {log.direction === "send" ? "机号:" : "机号:"}
                            </span>
                            <code className="ml-2 font-mono font-semibold">{log.parsed.machineNumber}</code>
                          </div>
                          {log.direction === "receive" && log.parsed.statusCode && (
                            <div className="bg-white p-2 rounded border col-span-2">
                              <span className="text-muted-foreground">状态码:</span>
                              <code className="ml-2 font-mono font-semibold">{log.parsed.statusCode}</code>
                            </div>
                          )}
                          <div className="bg-white p-2 rounded border">
                            <span className="text-muted-foreground">命令ID:</span>
                            <code className="ml-2 font-mono font-semibold">{log.parsed.commandId}</code>
                          </div>
                          <div className="bg-white p-2 rounded border">
                            <span className="text-muted-foreground">数据:</span>
                            <code className="ml-2 font-mono font-semibold text-[10px]">{log.parsed.data || "无"}</code>
                          </div>
                          <div className="bg-white p-2 rounded border">
                            <span className="text-muted-foreground">报文尾:</span>
                            <code className="ml-2 font-mono font-semibold">{log.parsed.footer}</code>
                          </div>
                          <div className="bg-white p-2 rounded border">
                            <span className="text-muted-foreground">校验码:</span>
                            <code className="ml-2 font-mono font-semibold">{log.parsed.checksum}</code>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <span className="text-xs font-medium text-muted-foreground">原始报文:</span>
                      <div className="mt-1 rounded bg-white p-2 font-mono text-xs break-all border">{log.rawHex}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">暂无通信记录</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DebugPanel({ onExecute }: { onExecute: (commandId: number, data?: any) => Promise<any> }) {
  const [selectedCommand, setSelectedCommand] = useState("0x01")
  const [paramValues, setParamValues] = useState<Record<string, string>>({})

  const commands = [
    { id: "0x01", name: "发送打印", params: [] },
    { id: "0x02", name: "加锁", params: [] },
    { id: "0x03", name: "解锁", params: [] },
    { id: "0x07", name: "获取打印小计", params: [] },
    { id: "0x08", name: "获取产品小计", params: [] },
    { id: "0x09", name: "获取打印总计", params: [] },
    { id: "0x0A", name: "获取产品总计", params: [] },
    { id: "0x0B", name: "复位小计", params: [] },
    { id: "0x0C", name: "复位总计", params: [] },
    { id: "0x0D", name: "复位序列号", params: [{ name: "编号", type: "number" }] },
    {
      id: "0x0E",
      name: "设置序列号",
      params: [
        { name: "编号", type: "number" },
        { name: "序列号", type: "number" },
      ],
    },
    { id: "0x11", name: "启动喷印", params: [] },
    { id: "0x12", name: "停止喷印", params: [] },
    { id: "0x13", name: "触发喷印", params: [] },
    { id: "0x14", name: "获取报警状态", params: [] },
    { id: "0x15", name: "取消报警闪烁", params: [] },
    { id: "0x18", name: "设置字体名称", params: [{ name: "字体名", type: "text" }] },
    { id: "0x19", name: "设置字体大小", params: [{ name: "大小", type: "number" }] },
    { id: "0x1A", name: "设置字体间距", params: [{ name: "间距", type: "number" }] },
    { id: "0x20", name: "设置打印模式", params: [{ name: "模式", type: "select", options: ["固定速度", "编码器"] }] },
    { id: "0x21", name: "清除1D缓存区", params: [] },
    {
      id: "0x22",
      name: "设置闪喷",
      params: [
        { name: "喷头", type: "number" },
        { name: "周期(秒)", type: "number" },
        { name: "列数", type: "number" },
      ],
    },
    {
      id: "0x23",
      name: "清洗喷头",
      params: [
        { name: "喷头", type: "select", options: ["所有", "1", "2", "3", "4", "5", "6"] },
        { name: "列数", type: "number" },
      ],
    },
    {
      id: "0x26",
      name: "获取墨盒余量",
      params: [{ name: "喷头", type: "select", options: ["所有", "1", "2", "3", "4", "5", "6"] }],
    },
    { id: "0x27", name: "喷嘴选择", params: [{ name: "喷嘴", type: "select", options: ["单列", "双列"] }] },
    { id: "0x28", name: "设置光眼有效电平", params: [{ name: "电平", type: "select", options: ["低电平", "高电平"] }] },
    {
      id: "0x29",
      name: "设置左右翻转",
      params: [
        { name: "喷头", type: "number" },
        { name: "翻转", type: "select", options: ["关", "开"] },
      ],
    },
    {
      id: "0x2A",
      name: "设置上下颠倒",
      params: [
        { name: "喷头", type: "number" },
        { name: "颠倒", type: "select", options: ["关", "开"] },
      ],
    },
    {
      id: "0x2B",
      name: "设置扫描方向",
      params: [
        { name: "喷头", type: "number" },
        { name: "方向", type: "select", options: ["从上到下", "从下到上"] },
      ],
    },
    {
      id: "0x2C",
      name: "设置灰度",
      params: [
        { name: "喷头", type: "number" },
        { name: "灰度值(1-6)", type: "number" },
      ],
    },
    {
      id: "0x2D",
      name: "设置喷头电压",
      params: [
        { name: "喷头", type: "number" },
        { name: "电压值(7.0-12.0)", type: "number" },
      ],
    },
    {
      id: "0x2E",
      name: "设置打印脉宽",
      params: [
        { name: "喷头", type: "number" },
        { name: "脉宽(μs)", type: "number" },
      ],
    },
    {
      id: "0x2F",
      name: "设置双列间距",
      params: [
        { name: "喷头", type: "number" },
        { name: "间距", type: "number" },
      ],
    },
    { id: "0x30", name: "设置编码器分辨率", params: [{ name: "分辨率", type: "number" }] },
    { id: "0x31", name: "设置编码器靠轮直径", params: [{ name: "直径(mm)", type: "number" }] },
    { id: "0x32", name: "设置打印延迟", params: [{ name: "延迟(mm)", type: "number" }] },
    { id: "0x33", name: "获取远端字段数据缓存数", params: [] },
    { id: "0x34", name: "设置字段最大缓存数", params: [{ name: "数量", type: "number" }] },
    { id: "0x35", name: "开启触发信号", params: [{ name: "开关", type: "select", options: ["关", "开"] }] },
    { id: "0x36", name: "开启保留字段最后信息", params: [{ name: "开关", type: "select", options: ["关", "开"] }] },
    { id: "0x37", name: "设置翻转延迟", params: [{ name: "延迟(ms)", type: "number" }] },
    { id: "0x38", name: "设置喷头选择", params: [{ name: "喷头编号", type: "number" }] },
    { id: "0x39", name: "设置喷头重叠", params: [{ name: "重叠列数", type: "number" }] },
    { id: "0x40", name: "设置墨盒参数设置模式", params: [{ name: "模式", type: "select", options: ["自动", "手动"] }] },
    { id: "0x41", name: "执行探测电压", params: [{ name: "喷头", type: "number" }] },
    { id: "0x42", name: "获取当前信息墨点数", params: [] },
  ]

  const handleExecute = () => {
    const commandId = Number.parseInt(selectedCommand)
    onExecute(commandId, paramValues)
  }

  const selectedCommandInfo = commands.find((c) => c.id === selectedCommand)

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>选择命令</Label>
        <Select value={selectedCommand} onValueChange={setSelectedCommand}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {commands.map((cmd) => (
              <SelectItem key={cmd.id} value={cmd.id}>
                {cmd.id} - {cmd.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedCommandInfo && selectedCommandInfo.params.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">命令参数</Label>
          {selectedCommandInfo.params.map((param, index) => (
            <div key={index} className="space-y-1">
              <Label className="text-xs text-muted-foreground">{param.name}</Label>
              {param.type === "select" ? (
                <Select
                  value={paramValues[param.name] || ""}
                  onValueChange={(value) => setParamValues({ ...paramValues, [param.name]: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`选择${param.name}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {param.options?.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={param.type}
                  placeholder={`输入${param.name}`}
                  value={paramValues[param.name] || ""}
                  onChange={(e) => setParamValues({ ...paramValues, [param.name]: e.target.value })}
                />
              )}
            </div>
          ))}
        </div>
      )}

      <Button onClick={handleExecute} className="w-full">
        <Send className="mr-2 h-4 w-4" />
        执行命令
      </Button>

      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm">
        <p className="font-medium mb-1">注意事项：</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground text-xs">
          <li>某些命令需要特定的喷码机状态才能执行</li>
          <li>修改墨盒参数前请确认了解其影响</li>
          <li>所有命令执行结果会在通信日志中显示</li>
        </ul>
      </div>
    </div>
  )
}
