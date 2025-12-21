# 喷码机控制系统 API 文档

## 概述

本系统提供完整的喷码机控制接口，使用TCP连接喷码机，可控制42步进电机导轨，并实时监控设备状态。

## 基础信息

- **基础URL**: `http://localhost:3000/api`
- **通信协议**: TIJ 6.6
- **连接方式**: TCP/IP

---

## API 端点

### 1. 连接喷码机

**端点**: `POST /api/printer/connect`

**描述**: 手动连接喷码机并执行握手

**响应**:
```json
{
  "success": true
}
```

---

### 2. 断开连接

**端点**: `POST /api/printer/disconnect`

**描述**: 断开与喷码机的连接

**响应**:
```json
{
  "success": true
}
```

---

### 3. 获取打印机状态

**端点**: `GET /api/printer/status`

**描述**: 获取喷码机当前状态，包括连接状态、墨盒余量、CPU温度等（20秒自动刷新一次）

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

### 4. 发送打印任务

**端点**: `POST /api/printer/print`

**描述**: 发送二维码或文本打印内容到喷码机

**请求体（二维码）**:
```json
{
  "type": "qrcode",
  "url": "https://example.com",
  "quantity": 10,
  "size": 3,
  "errorLevel": "L",
  "x": 0,
  "y": 0
}
```

**请求体（文本）**:
```json
{
  "type": "text",
  "content": "Hello World",
  "size": 24,
  "x": 0,
  "y": 0,
  "rotation": 0
}
```

**字段说明**:
- `type` (string, 必需): "qrcode" 或 "text"
- **二维码参数**:
  - `url` (string, 必需): 二维码内容URL
  - `quantity` (number): 打印数量（默认1）
  - `size` (number): 线条宽度3-15（默认3）
  - `errorLevel` (string): 容错级别 "L"|"M"|"Q"|"H"（默认"L"）
  - `x`, `y` (number): 坐标位置（默认0,0）
- **文本参数**:
  - `content` (string, 必需): 文本内容
  - `size` (number): 字体大小5-400（默认24）
  - `x`, `y` (number): 坐标位置（默认0,0）
  - `rotation` (number): 旋转角度0-359（默认0）

**响应**:
```json
{
  "success": true,
  "message": "内容已发送到喷码机"
}
```

---

### 5. 启动喷印

**端点**: `POST /api/printer/start`

**描述**: 启动喷码机开始喷印（命令0x11）

**响应**:
```json
{
  "success": true
}
```

---

### 6. 停止喷印

**端点**: `POST /api/printer/stop`

**描述**: 停止喷码机喷印（命令0x12）

**响应**:
```json
{
  "success": true
}
```

---

### 7. 触发喷印

**端点**: `POST /api/printer/trigger`

**描述**: 触发一次打印动作，模拟光眼信号（命令0x13），需要先启动喷印

**响应**:
```json
{
  "success": true,
  "message": "触发喷印成功"
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "喷印未启动，请先启动喷印"
}
```

---

### 8. 执行调试命令

**端点**: `POST /api/printer/debug`

**描述**: 执行TIJ协议中的任意命令（用于调试面板）

**请求体**:
```json
{
  "commandId": 28,
  "params": {
    "value": 10
  }
}
```

**响应**:
```json
{
  "success": true,
  "data": "响应数据",
  "statusText": "成功 - 无错误"
}
```

---

### 9. 获取通信日志

**端点**: `GET /api/printer/logs`

**描述**: 获取与喷码机的通信记录（最近50条）

**响应**:
```json
[
  {
    "id": "1234567890123.456",
    "timestamp": "14:32:15",
    "direction": "send",
    "commandId": "0x1C",
    "commandName": "发送信息文件",
    "data": "025152010400000000...",
    "rawHex": "1B02001C000024025152...",
    "parsed": {
      "header": "1B02",
      "machineNumber": "00",
      "commandId": "1C",
      "data": "025152...",
      "footer": "1B03",
      "checksum": "91"
    },
    "statusText": "成功 - 无错误"
  }
]
```

**字段说明**:
- `direction`: "send" (发送) 或 "receive" (接收)
- `commandId`: 命令ID (十六进制)
- `commandName`: 命令名称
- `data`: 数据内容（十六进制）
- `rawHex`: 原始完整报文（十六进制）
- `parsed`: 解析后的各字段
- `statusText`: 状态码说明（仅接收方向有）

---

### 10. 控制导轨移动

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

### 11. 更新系统设置

**端点**: `POST /api/settings`

**描述**: 更新喷码机TCP连接、机号和步进电机配置

**请求体**:
```json
{
  "tcpHost": "169.254.59.119",
  "tcpPort": 139,
  "machineNumber": 119,
  "stepperDirPin": 20,
  "stepperStepPin": 21,
  "stepperEnablePin": 16
}
```

**字段说明**:
- `tcpHost` (string): 喷码机IP地址
- `tcpPort` (number): TCP端口
- `machineNumber` (number): 机器编号（通常为IP最后一位）
- `stepperDirPin` (number): 步进电机方向引脚
- `stepperStepPin` (number): 步进电机步进引脚（PWM）
- `stepperEnablePin` (number): 步进电机使能引脚

**响应**:
```json
{
  "success": true,
  "message": "设置已更新"
}
```

---

### 12. 获取当前设置

**端点**: `GET /api/settings`

**描述**: 获取当前系统配置

**响应**:
```json
{
  "tcpHost": "169.254.59.119",
  "tcpPort": 139,
  "machineNumber": 119,
  "stepperDirPin": 20,
  "stepperStepPin": 21,
  "stepperEnablePin": 16
}
```

---

## 正确的打印流程

### 完整流程（推荐）

1. **连接喷码机** → `POST /api/printer/connect`
2. **发送内容** → `POST /api/printer/print` （命令0x1C + 0x01）
3. **启动喷印** → `POST /api/printer/start` （命令0x11）
4. **触发打印** → `POST /api/printer/trigger` （命令0x13）
5. **停止喷印** → `POST /api/printer/stop` （命令0x12）
6. **断开连接** → `POST /api/printer/disconnect`

### 流程说明

- **发送内容**: 使用命令0x1C上传信息文件，然后用命令0x01更新打印内容
- **启动喷印**: 必须先启动喷码机才能打印
- **触发打印**: 模拟光眼信号，实际执行打印动作
- **停止喷印**: 完成打印后停止喷码机

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

#### TCP连接
- **IP地址**: 169.254.59.119 (可配置)
- **端口**: 139 (可配置)
- **机号**: 119 (IP最后一位，可配置)
- **协议**: TIJ 6.6

---

## TIJ 协议命令参考

### 常用命令列表

| 命令ID | 十六进制 | 名称 | 功能说明 |
|--------|---------|------|----------|
| 0 | 0x00 | 握手通信 | 测试连接是否正常 |
| 1 | 0x01 | 发送打印 | 更新打印内容 |
| 17 | 0x11 | 启动喷印 | 启动喷码机开始工作 |
| 18 | 0x12 | 停止喷印 | 停止喷码机工作 |
| 19 | 0x13 | 触发喷印 | 触发一次打印动作 |
| 20 | 0x14 | 获取报警 | 获取设备报警状态 |
| 28 | 0x1C | 发送信息文件 | 发送二维码等信息文件 |
| 38 | 0x26 | 获取墨盒余量 | 获取墨盒剩余量 |

### 协议数据格式

**命令格式**:
```
1B 02 [机器编号] [命令ID] [数据内容] 1B 03 [校验和]
```

**响应格式（成功）**:
```
1B 06 [机器编号] [状态码] [命令ID] [数据内容] 1B 03 [校验和]
```

**响应格式（失败）**:
```
1B 15 [机器编号] [状态码] [命令ID] [数据内容] 1B 03 [校验和]
```

**校验和计算**:
```javascript
// 将所有字节相加
let sum = 0;
for (let i = 0; i < data.length; i++) {
  sum += data[i];
}
// 计算2补码
const checksum = (0x100 - (sum & 0xFF)) & 0xFF;
```

---

## 状态码参考

| 状态码 | 十六进制 | 说明 |
|--------|---------|------|
| 0 | 0x00 | 成功 - 无错误 |
| 1 | 0x01 | 喷码机错误 |
| 8 | 0x08 | 无效校验码 |
| 10 | 0x0A | 解析失败，未知的模块类型 |
| 17 | 0x11 | 喷印已启动 |
| 18 | 0x12 | 喷印未启动 |
| 20 | 0x14 | 打印间隔过小 |

---

## 使用流程

### 1. 配置系统

1. 打开网页控制面板
2. 点击右上角设置图标 ⚙️
3. 配置TCP连接参数
   - IP地址: 169.254.59.119
   - 端口: 139
   - 机号: 119（自动根据IP计算）
4. 设置步进电机GPIO引脚
5. 保存设置（自动保存到localStorage）

### 2. 连接喷码机

1. 点击"连接"按钮
2. 等待连接成功提示
3. 观察状态卡片显示"已连接"

### 3. 打印二维码/文本

1. 在"内容设置"卡片中选择类型（二维码/文本）
2. **二维码**:
   - 输入URL链接
   - 设置打印数量、大小、位置等
   - 选择容错级别
3. **文本**:
   - 输入文本内容
   - 设置字体大小、旋转角度、位置等
4. 点击"发送打印"按钮上传内容
5. 点击"启动喷印"启动喷码机
6. 点击"触发喷印"执行打印
7. 完成后点击"停止喷印"

### 4. 控制导轨

1. 使用左右箭头按钮移动导轨
2. 观察位置指示器实时反馈
3. 当前位置显示在中央

### 5. 监控状态

实时监控以下信息:
- **连接状态**: 已连接/未连接
- **墨盒余量**: 百分比和可视化进度条，点击刷新按钮手动更新
- **CPU温度**: 树莓派板载温度传感器读数
- **打印状态**: 打印中/待机

### 6. 查看通信日志

- 所有与喷码机的通信都会记录在通信日志中
- **发送命令**: 蓝色背景
- **接收响应**: 绿色背景
- 包含完整的协议解析：
  - 报文头/报文尾
  - 机号
  - 状态码和状态说明
  - 命令ID
  - 数据内容（十六进制）
  - 校验码
  - 原始报文

### 7. 调试面板

1. 点击"调试面板"标签页
2. 选择命令分类（基础、打印、设置等）
3. 选择具体命令
4. 输入参数（如果需要）
5. 点击"执行"按钮
6. 在通信日志中查看结果

---

## 注意事项

1. **权限**: 树莓派GPIO需要root权限，运行前执行：
   ```bash
   sudo pigpiod
   sudo systemctl enable pigpiod
   ```

2. **依赖安装**:
   ```bash
   sudo apt-get install pigpio
   npm install
   ```

3. **网络配置**: 确保树莓派和喷码机在同一网络，且IP地址配置正确

4. **机号设置**: 机号通常等于喷码机IP地址的最后一个字节（如169.254.59.119的机号为119）

5. **打印流程**: 必须按照"发送内容 → 启动喷印 → 触发喷印"的顺序操作

6. **步进电机**: 修改GPIO引脚后需要重新初始化，建议停止所有操作后再更改

7. **通信日志**: 最多保留最近50条记录

8. **CPU温度**: 温度数值从 `/sys/class/thermal/thermal_zone0/temp` 读取（毫摄氏度），自动转换为摄氏度

9. **状态轮询**: 状态信息每20秒自动刷新一次，墨盒余量可手动刷新

10. **断开连接**: 点击断开后会立即销毁TCP连接，需要重新连接才能操作

---

## 故障排除

### 1. 连接失败

**问题**: 无法连接到喷码机

**解决方案**:
- 检查IP地址和端口是否正确
- 使用 `ping 169.254.59.119` 测试网络连通性
- 确认喷码机电源已开启
- 检查防火墙设置

### 2. 状态码 0x08 (无效校验码)

**问题**: 喷码机返回校验码错误

**解决方案**:
- 这是正常的协议验证，系统会自动重试
- 查看通信日志确认发送的数据格式
- 如果持续出现，检查网络稳定性

### 3. 状态码 0x0A (未知模块类型)

**问题**: 喷码机无法识别模块类型

**解决方案**:
- 检查二维码/文本内容是否正确
- 确认参数设置在有效范围内
- 查看服务器日志获取详细的数据格式信息

### 4. 状态码 0x12 (喷印未启动)

**问题**: 尝试打印但喷码机未启动

**解决方案**:
- 先点击"启动喷印"按钮
- 等待启动成功后再触发打印
- 检查喷码机是否有报警

### 5. 打印没有输出

**问题**: 触发打印后没有任何输出

**解决方案**:
- 确认按照正确流程操作：发送内容 → 启动喷印 → 触发喷印
- 检查墨盒余量是否充足
- 查看通信日志确认所有命令都成功执行
- 检查喷码机是否有报警状态

### 6. 步进电机不动

**问题**: 点击左右按钮但导轨不移动

**解决方案**:
- 检查GPIO引脚连接是否正确
- 确认 `pigpiod` 服务正在运行: `sudo systemctl status pigpiod`
- 检查步进电机驱动器电源
- 查看服务器日志获取错误信息

### 7. CPU温度显示为0

**问题**: CPU温度一直显示0°C

**解决方案**:
- 检查 `/sys/class/thermal/thermal_zone0/temp` 文件是否存在
- 确认运行在树莓派上（其他系统可能没有此文件）
- 查看服务器日志中的温度读取信息

---

## 技术支持

如遇问题，请检查:
1. 硬件连接是否正确
2. 树莓派GPIO服务是否启动
3. TCP连接的IP地址、端口和机号是否正确
4. 使用 `ping` 测试网络连通性
5. 查看浏览器控制台（F12）和服务器日志获取详细错误信息
6. 查看通信日志了解命令执行情况

---

## 示例代码

### 使用 curl 测试API

```bash
# 连接喷码机
curl -X POST http://localhost:3000/api/printer/connect

# 发送二维码打印任务
curl -X POST http://localhost:3000/api/printer/print \
  -H "Content-Type: application/json" \
  -d '{"type":"qrcode","url":"https://example.com","quantity":5,"size":3,"errorLevel":"L","x":0,"y":0}'

# 发送文本打印任务
curl -X POST http://localhost:3000/api/printer/print \
  -H "Content-Type: application/json" \
  -d '{"type":"text","content":"Hello World","size":24,"x":0,"y":0,"rotation":0}'

# 启动喷印
curl -X POST http://localhost:3000/api/printer/start

# 触发喷印
curl -X POST http://localhost:3000/api/printer/trigger

# 停止喷印
curl -X POST http://localhost:3000/api/printer/stop

# 获取状态
curl http://localhost:3000/api/printer/status

# 控制导轨
curl -X POST http://localhost:3000/api/stepper/move \
  -H "Content-Type: application/json" \
  -d '{"direction":"right","steps":100}'

# 断开连接
curl -X POST http://localhost:3000/api/printer/disconnect
```

### JavaScript 示例

```javascript
// 完整的打印流程
async function printQRCode(url) {
  try {
    // 1. 连接喷码机
    await fetch('/api/printer/connect', { method: 'POST' });
    
    // 2. 发送内容
    await fetch('/api/printer/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'qrcode',
        url: url,
        quantity: 1,
        size: 3,
        errorLevel: 'L',
        x: 0,
        y: 0
      })
    });
    
    // 3. 启动喷印
    await fetch('/api/printer/start', { method: 'POST' });
    
    // 4. 触发打印
    await fetch('/api/printer/trigger', { method: 'POST' });
    
    console.log('打印完成');
    
    // 5. 停止喷印
    await fetch('/api/printer/stop', { method: 'POST' });
    
  } catch (error) {
    console.error('打印失败:', error);
  }
}

// 获取状态
async function getStatus() {
  const response = await fetch('/api/printer/status');
  const status = await response.json();
  console.log('Connected:', status.connected);
  console.log('Cartridge:', status.cartridgeLevel + '%');
  console.log('Temperature:', status.cpuTemperature + '°C');
  console.log('Printing:', status.printing);
}

// 执行调试命令
async function executeDebugCommand(commandId, params = {}) {
  const response = await fetch('/api/printer/debug', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commandId, params })
  });
  const result = await response.json();
  console.log('Command result:', result);
}
