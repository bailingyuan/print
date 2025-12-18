# 喷码机控制系统 API 文档

## 概述

本系统提供完整的喷码机控制接口，支持串口和TCP两种连接方式，可控制42步进电机导轨，并实时监控设备状态。

## 基础信息

- **基础URL**: `http://localhost:3000/api`
- **通信协议**: TIJ 6.6
- **支持连接**: 串口(Serial)、TCP/IP

---

## API 端点

### 1. 获取打印机状态

**端点**: `GET /api/printer/status`

**描述**: 获取喷码机当前状态，包括连接状态、墨盒余量、CPU温度等

**响应**:
```json
{
  "connected": true,
  "cartridgeLevel": 85,
  "cpuTemperature": 45.2,
  "printing": false,
  "error": null
}
```

**字段说明**:
- `connected` (boolean): 喷码机连接状态
- `cartridgeLevel` (number): 墨盒剩余量百分比 (0-100)
- `cpuTemperature` (number): 树莓派CPU温度（℃）
- `printing` (boolean): 是否正在打印
- `error` (string|null): 错误信息

---

### 2. 发送打印任务

**端点**: `POST /api/printer/print`

**描述**: 发送二维码打印任务

**请求体**:
```json
{
  "url": "https://example.com",
  "quantity": 10
}
```

**字段说明**:
- `url` (string, 必需): 二维码内容URL
- `quantity` (number, 必需): 打印数量

**响应**:
```json
{
  "success": true,
  "message": "Print job sent successfully"
}
```

---

### 3. 启动喷印

**端点**: `POST /api/printer/start`

**描述**: 启动喷码机开始喷印

**响应**:
```json
{
  "success": true
}
```

---

### 4. 停止喷印

**端点**: `POST /api/printer/stop`

**描述**: 停止喷码机喷印

**响应**:
```json
{
  "success": true
}
```

---

### 5. 获取通信日志

**端点**: `GET /api/printer/logs`

**描述**: 获取与喷码机的通信记录

**响应**:
```json
[
  {
    "id": "1234567890123.456",
    "timestamp": "14:32:15",
    "direction": "send",
    "commandId": "0x1C",
    "commandName": "Send QR Code Info",
    "data": "QRCode data...",
    "rawHex": "1B02001C..."
  }
]
```

**字段说明**:
- `direction`: "send" (发送) 或 "receive" (接收)
- `commandId`: 命令ID (十六进制)
- `commandName`: 命令名称
- `data`: 数据内容（UTF-8）
- `rawHex`: 原始十六进制数据

---

### 6. 控制导轨移动

**端点**: `POST /api/stepper/move`

**描述**: 控制步进电机导轨移动

**请求体**:
```json
{
  "direction": "left",
  "steps": 100
}
```

**字段说明**:
- `direction` (string, 必需): 移动方向 "left" 或 "right"
- `steps` (number, 必需): 移动步数

**响应**:
```json
{
  "success": true,
  "position": -100
}
```

---

### 7. 更新系统设置

**端点**: `POST /api/settings`

**描述**: 更新喷码机连接和步进电机配置

**请求体**:
```json
{
  "connectionType": "serial",
  "serialPort": "/dev/ttyUSB0",
  "serialBaudRate": 115200,
  "tcpHost": "192.168.1.100",
  "tcpPort": 9100,
  "stepperDirPin": 20,
  "stepperStepPin": 21,
  "stepperEnablePin": 16
}
```

**响应**:
```json
{
  "success": true,
  "message": "Settings updated successfully"
}
```

---

### 8. 获取当前设置

**端点**: `GET /api/settings`

**描述**: 获取当前系统配置

**响应**:
```json
{
  "connectionType": "serial",
  "serialPort": "/dev/ttyUSB0",
  "serialBaudRate": 115200,
  "tcpHost": "192.168.1.100",
  "tcpPort": 9100,
  "stepperDirPin": 20,
  "stepperStepPin": 21,
  "stepperEnablePin": 16
}
```

---

## 硬件连接说明

### 42步进电机连接

**引脚定义**:
- **GND**: 接地线 → 树莓派 GND 引脚
- **5V**: 电源线 → 树莓派 5V 引脚
- **DIR**: 方向控制 → GPIO 20 (可配置)
- **STEP**: 步进信号 → GPIO 21 (可配置，支持PWM)
- **ENABLE**: 使能控制 → GPIO 16 (可配置)

### 喷码机连接

#### 串口连接
- **设备**: `/dev/ttyUSB0` (可配置)
- **波特率**: 115200 (可配置)
- **数据位**: 8
- **停止位**: 1
- **校验位**: 无

#### TCP连接
- **IP地址**: 192.168.1.100 (可配置)
- **端口**: 9100 (可配置)

---

## 使用流程

### 1. 配置系统

1. 打开网页控制面板
2. 点击右上角设置图标
3. 选择连接方式（串口/TCP）
4. 配置相应参数
5. 设置步进电机GPIO引脚
6. 保存设置

### 2. 打印二维码

1. 在"二维码打印"卡片中输入URL
2. 设置打印数量
3. 点击"发送打印"按钮
4. 查看通信日志确认命令发送成功

### 3. 控制导轨

1. 使用左右箭头按钮移动导轨
2. 观察位置指示器实时反馈
3. 当前位置显示在中央

### 4. 监控状态

实时监控以下信息:
- 连接状态 (已连接/未连接)
- 墨盒余量 (百分比和可视化进度条)
- 树莓派CPU温度
- 打印状态 (打印中/待机)

### 5. 查看通信日志

- 所有与喷码机的通信都会记录在通信日志中
- 发送命令显示为蓝色
- 接收响应显示为绿色
- 包含命令名称、数据内容和原始十六进制

---

## 错误代码

| 状态码 | 说明 |
|--------|------|
| 0x00 | 成功 |
| 0x01 | 命令不支持 |
| 0x02 | 参数错误 |
| 0x03 | 设备忙 |
| 0x04 | 墨盒错误 |
| 0x05 | 超时 |

---

## 注意事项

1. **权限**: 树莓派GPIO和串口需要root权限，运行前执行：
   ```bash
   sudo pigpiod
   sudo chmod 666 /dev/ttyUSB0
   ```

2. **依赖安装**:
   ```bash
   sudo apt-get install pigpio
   npm install
   ```

3. **连接切换**: 切换连接方式时会自动关闭现有连接

4. **步进电机**: 修改GPIO引脚后需要重新初始化，建议停止所有操作后再更改

5. **通信日志**: 最多保留最近50条记录

---

## 技术支持

如遇问题，请检查:
1. 硬件连接是否正确
2. 树莓派GPIO服务是否启动 (`sudo pigpiod`)
3. 串口设备路径是否正确 (`ls /dev/tty*`)
4. TCP连接的IP地址和端口是否正确
5. 查看浏览器控制台和服务器日志获取详细错误信息
