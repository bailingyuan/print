"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Send, CheckCircle2, XCircle } from "lucide-react"

// All TIJ protocol commands organized by category
const COMMAND_CATEGORIES = {
  basic: {
    name: "基本命令",
    commands: [
      { id: 0x00, name: "握手通信", params: [] },
      { id: 0x01, name: "发送打印", params: [] },
      { id: 0x02, name: "加锁", params: [{ name: "密码", key: "password", type: "text" }] },
      { id: 0x03, name: "解锁", params: [{ name: "密码", key: "password", type: "text" }] },
    ],
  },
  counter: {
    name: "计数器管理",
    commands: [
      { id: 0x07, name: "获取打印小计", params: [] },
      { id: 0x08, name: "获取产品小计", params: [] },
      { id: 0x09, name: "获取打印总计", params: [] },
      { id: 0x0a, name: "获取产品总计", params: [] },
      { id: 0x0b, name: "复位小计", params: [] },
      { id: 0x0c, name: "复位总计", params: [] },
      { id: 0x0d, name: "复位序列号", params: [{ name: "序列号编号", key: "serialNum", type: "number" }] },
      {
        id: 0x0e,
        name: "设置序列号",
        params: [
          { name: "序列号编号", key: "serialNum", type: "number" },
          { name: "当前值", key: "value", type: "number" },
        ],
      },
    ],
  },
  printing: {
    name: "打印控制",
    commands: [
      { id: 0x11, name: "启动喷印", params: [] },
      { id: 0x12, name: "停止喷印", params: [] },
      { id: 0x13, name: "触发喷印", params: [] },
      { id: 0x14, name: "获取报警状态", params: [] },
      { id: 0x15, name: "取消报警闪烁", params: [] },
    ],
  },
  font: {
    name: "字体设置",
    commands: [
      { id: 0x18, name: "设置字体名称", params: [{ name: "字体名称", key: "fontName", type: "text" }] },
      { id: 0x19, name: "设置字体大小", params: [{ name: "字体大小", key: "fontSize", type: "number" }] },
      { id: 0x1a, name: "设置字体间距", params: [{ name: "间距", key: "spacing", type: "number" }] },
    ],
  },
  content: {
    name: "内容管理",
    commands: [
      { id: 0x1c, name: "发送信息文件", params: [{ name: "文件数据(hex)", key: "fileData", type: "hex" }] },
      {
        id: 0x1d,
        name: "填充远端字段数据",
        params: [
          { name: "字段ID", key: "fieldId", type: "number" },
          { name: "数据内容", key: "data", type: "text" },
        ],
      },
      { id: 0x1e, name: "加载信息库信息", params: [{ name: "信息索引", key: "index", type: "number" }] },
      { id: 0x1f, name: "获取信息库文件名", params: [] },
      { id: 0x21, name: "清除1D缓存区", params: [] },
    ],
  },
  printMode: {
    name: "打印模式",
    commands: [
      { id: 0x20, name: "设置打印模式", params: [{ name: "模式(0-4)", key: "mode", type: "number" }] },
      {
        id: 0x22,
        name: "设置闪喷",
        params: [
          { name: "开关(0/1)", key: "enable", type: "number" },
          { name: "次数", key: "times", type: "number" },
        ],
      },
    ],
  },
  nozzle: {
    name: "喷头设置",
    commands: [
      { id: 0x23, name: "清洗喷头", params: [{ name: "列数(0-2)", key: "column", type: "number" }] },
      { id: 0x26, name: "获取墨盒余量", params: [] },
      { id: 0x27, name: "喷嘴选择", params: [{ name: "喷嘴(0-6)", key: "nozzle", type: "number" }] },
      { id: 0x2c, name: "设置灰度", params: [{ name: "灰度(1-6)", key: "grayscale", type: "number" }] },
      { id: 0x2d, name: "设置喷头电压", params: [{ name: "电压值", key: "voltage", type: "number" }] },
      { id: 0x2e, name: "设置打印脉宽", params: [{ name: "脉宽", key: "pulseWidth", type: "number" }] },
      { id: 0x2f, name: "设置双列间距", params: [{ name: "间距", key: "distance", type: "number" }] },
      { id: 0x38, name: "设置喷头选择", params: [{ name: "喷头编号", key: "headNum", type: "number" }] },
      { id: 0x39, name: "设置喷头重叠", params: [{ name: "重叠值", key: "overlap", type: "number" }] },
      { id: 0x40, name: "设置墨盒参数模式", params: [{ name: "模式(0-3)", key: "mode", type: "number" }] },
      { id: 0x41, name: "执行探测电压", params: [] },
      { id: 0x42, name: "获取当前信息墨点数", params: [] },
    ],
  },
  sensor: {
    name: "传感器与延时",
    commands: [
      { id: 0x28, name: "设置光眼有效电平", params: [{ name: "电平(0/1)", key: "level", type: "number" }] },
      { id: 0x30, name: "设置编码器分辨率", params: [{ name: "分辨率", key: "resolution", type: "number" }] },
      { id: 0x31, name: "设置编码器靠轮直径", params: [{ name: "直径(mm)", key: "diameter", type: "number" }] },
      { id: 0x32, name: "设置打印延迟", params: [{ name: "延迟(mm)", key: "delay", type: "number" }] },
      { id: 0x35, name: "开启触发信号", params: [{ name: "开关(0/1)", key: "enable", type: "number" }] },
      { id: 0x36, name: "开启保留字段最后信息", params: [{ name: "开关(0/1)", key: "enable", type: "number" }] },
      { id: 0x37, name: "设置翻转延迟", params: [{ name: "延迟(mm)", key: "delay", type: "number" }] },
    ],
  },
  transform: {
    name: "翻转与扫描",
    commands: [
      { id: 0x29, name: "设置左右翻转", params: [{ name: "翻转(0/1)", key: "flip", type: "number" }] },
      { id: 0x2a, name: "设置上下颠倒", params: [{ name: "颠倒(0/1)", key: "flip", type: "number" }] },
      { id: 0x2b, name: "设置扫描方向", params: [{ name: "方向(0-3)", key: "direction", type: "number" }] },
    ],
  },
  field: {
    name: "字段管理",
    commands: [
      { id: 0x33, name: "获取远端字段数据缓存数", params: [] },
      { id: 0x34, name: "设置字段最大缓存数", params: [{ name: "缓存数", key: "maxBuffer", type: "number" }] },
    ],
  },
  file: {
    name: "文件操作",
    commands: [{ id: 0x50, name: "发送文件", params: [{ name: "文件数据(hex)", key: "fileData", type: "hex" }] }],
  },
  system: {
    name: "系统信息",
    commands: [{ id: 0xfd, name: "墨盒唯一标识", params: [] }],
  },
}

interface DebugPanelProps {
  onExecute: (commandId: number, params: any) => Promise<any>
  onUpdate: () => void
}

export function DebugPanel({ onExecute, onUpdate }: DebugPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState("basic")
  const [commandParams, setCommandParams] = useState<Record<string, any>>({})
  const [executing, setExecuting] = useState(false)
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleExecute = async (commandId: number) => {
    setExecuting(true)
    setLastResult(null)

    try {
      const params = commandParams[commandId] || {}
      const result = await onExecute(commandId, params)

      setLastResult({
        success: result.success,
        message: result.statusText || (result.success ? "命令执行成功" : "命令执行失败"),
      })

      // Refresh logs
      onUpdate()

      // Clear result after 3 seconds
      setTimeout(() => setLastResult(null), 3000)
    } catch (error) {
      setLastResult({
        success: false,
        message: "命令执行异常",
      })
    } finally {
      setExecuting(false)
    }
  }

  const handleParamChange = (commandId: number, paramKey: string, value: string) => {
    setCommandParams((prev) => ({
      ...prev,
      [commandId]: {
        ...prev[commandId],
        [paramKey]: value,
      },
    }))
  }

  return (
    <div className="space-y-4">
      {lastResult && (
        <Card className={lastResult.success ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}>
          <CardContent className="flex items-center gap-2 py-3">
            {lastResult.success ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            <span className={lastResult.success ? "text-green-900" : "text-red-900"}>{lastResult.message}</span>
          </CardContent>
        </Card>
      )}

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <ScrollArea className="w-full">
          <TabsList className="inline-flex h-auto flex-wrap gap-2 bg-transparent p-0">
            {Object.entries(COMMAND_CATEGORIES).map(([key, category]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea>

        {Object.entries(COMMAND_CATEGORIES).map(([key, category]) => (
          <TabsContent key={key} value={key} className="space-y-3 mt-4">
            {category.commands.map((command) => (
              <Card key={command.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {command.name}
                        <Badge variant="outline" className="ml-2">
                          0x{command.id.toString(16).toUpperCase().padStart(2, "0")}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">
                        命令ID: {command.id} (0x{command.id.toString(16).toUpperCase()})
                      </CardDescription>
                    </div>
                    <Button size="sm" onClick={() => handleExecute(command.id)} disabled={executing}>
                      <Send className="mr-1 h-3 w-3" />
                      执行
                    </Button>
                  </div>
                </CardHeader>

                {command.params.length > 0 && (
                  <CardContent className="space-y-3">
                    <Separator />
                    <div className="grid gap-3">
                      {command.params.map((param) => (
                        <div key={param.key} className="space-y-1.5">
                          <Label htmlFor={`${command.id}-${param.key}`} className="text-sm">
                            {param.name}
                          </Label>
                          <Input
                            id={`${command.id}-${param.key}`}
                            type={param.type === "number" ? "number" : "text"}
                            placeholder={`输入${param.name}`}
                            value={commandParams[command.id]?.[param.key] || ""}
                            onChange={(e) => handleParamChange(command.id, param.key, e.target.value)}
                            className="h-9"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-sm">使用说明</CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2 text-muted-foreground">
          <p>• 所有命令按功能分类组织，选择对应标签页查看相关命令</p>
          <p>• 部分命令需要输入参数，请根据提示填写正确的值</p>
          <p>• 执行命令后，响应结果会显示在通信日志区域</p>
          <p>• 详细的协议说明请参考TIJ通讯协议文档</p>
        </CardContent>
      </Card>
    </div>
  )
}
