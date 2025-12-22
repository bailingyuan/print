# 喷码机控制系统 API 文档

## 概述

本系统提供完整的喷码机控制接口，使用TCP连接喷码机，支持二维码和文本打印，可控制42步进电机导轨，并实时监控设备状态。

系统使用TIJ 6.6通讯协议，通过图案模块(0x07)发送二维码，自动将URL转换为标准二维码位图。

## 基础信息

- **基础URL**: `http://localhost:3000/api`
- **通信协议**: TIJ 6.6
- **连接方式**: TCP/IP
- **二维码方式**: 图案模块(0x07) - 将URL转换为位图发送
- **文本方式**: 文本模块(0x01) - 直接发送文本内容

---

## API 端点

### 1. 连接喷码机

**端点**: `POST /api/printer/connect`

**描述**: 手动连接喷码机并执行握手通信（命令0x00）

**请求体**: 无

**响应**:
```json
{
  "success": true,
  "message": "喷码机连接成功"
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "连接失败: 网络超时"
}
```

---

### 2. 断开连接

**端点**: `POST /api/printer/disconnect`

**描述**: 断开与喷码机的TCP连接，销毁所有监听器

**请求体**: 无

**响应**:
```json
{
  "success": true,
  "message": "连接已断开"
}
```

---

### 3. 获取打印机状态

**端点**: `GET /api/printer/status`

**描述**: 获取喷码机当前状态，包括连接状态、墨盒余量、CPU温度等。系统每20秒自动刷新一次。

**请求参数**: 无

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
- `connected` (boolean): 喷码机TCP连接状态
- `cartridgeLevel` (number): 墨盒剩余量百分比 (0-100)，通过命令0x26查询
- `cpuTemperature` (number): 树莓派CPU温度（摄氏度），从 `/sys/class/thermal/thermal_zone0/temp` 读取
- `printing` (boolean): 是否正在喷印（已执行启动喷印命令0x11）
- `error` (string|null): 错误信息

---

### 4. 发送打印任务

**端点**: `POST /api/printer/print`

**描述**: 发送二维码或文本打印内容到喷码机。二维码使用图案模块(0x07)，文本使用文本模块(0x01)。

#### 二维码打印

**请求体**:
```json
{
  "type": "qrcode",
  "url": "https://example.com",
  "size": 3,
  "x": 0,
  "y": 0,
  "inverse": false
}
```

**字段说明**:
- `type` (string, 必需): 固定为 "qrcode"
- `url` (string, 必需): 二维码内容URL，长度建议不超过200字符
- `size` (number, 可选): 放大倍数 1-5，默认3
  - 1 = 1倍 (100x100像素)
  - 2 = 2倍 (200x200像素)
  - 3 = 3倍 (300x300像素) - 推荐
  - 4 = 4倍 (400x400像素)
  - 5 = 5倍 (500x500像素)
- `x` (number, 可选): X坐标（像素），默认0
- `y` (number, 可选): Y坐标（像素），默认0
- `inverse` (boolean, 可选): 是否反色打印（黑白反转），默认false

#### 文本打印

**请求体**:
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
- `type` (string, 必需): 固定为 "text"
- `content` (string, 必需): 文本内容，支持ASCII和中文
- `size` (number, 可选): 字体大小 5-400，默认24
- `x` (number, 可选): X坐标（像素），默认0
- `y` (number, 可选): Y坐标（像素），默认0
- `rotation` (number, 可选): 旋转角度 0|90|180|270，默认0

**响应**:
```json
{
  "success": true,
  "message": "内容已发送到喷码机",
  "details": {
    "infoFileResult": {
      "success": true,
      "statusCode": 0,
      "statusText": "成功 - 无错误"
    },
    "printCommandResult": {
      "success": true,
      "statusCode": 0,
      "statusText": "成功 - 无错误"
    }
  }
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "内容为空，请输入URL或文本",
  "details": "具体错误信息"
}
```

---

### 5. 启动喷印

**端点**: `POST /api/printer/start`

**描述**: 启动喷码机开始喷印（TIJ命令0x11），喷码机进入待打印状态

**请求体**: 无

**响应**:
```json
{
  "success": true,
  "message": "喷印已启动",
  "statusCode": 0
}
```

**说明**: 启动后喷码机等待触发信号（光眼或模拟喷印命令）来执行实际打印

---

### 6. 停止喷印

**端点**: `POST /api/printer/stop`

**描述**: 停止喷码机喷印（TIJ命令0x12）

**请求体**: 无

**响应**:
```json
{
  "success": true,
  "message": "喷印已停止",
  "statusCode": 0
}
```

---

### 7. 触发喷印（模拟光眼）

**端点**: `POST /api/printer/trigger`

**描述**: 触发一次打印动作，模拟光眼信号（TIJ命令0x13）。必须先执行启动喷印(0x11)才能触发。

**请求体**: 无

**响应**:
```json
{
  "success": true,
  "message": "触发喷印成功",
  "statusCode": 0
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "喷印未启动，请先启动喷印",
  "statusCode": 18
}
```

**说明**: 
- 此命令替代物理光眼传感器，用于手动触发打印
- 适用于测试或无光眼场景
- 每次触发打印一个内容单元

---

### 8. 执行调试命令

**端点**: `POST /api/printer/debug`

**描述**: 执行TIJ协议中的任意命令，用于调试和高级功能测试

**请求体**:
```json
{
  "commandId": 28,
  "params": {
    "value": 10
  }
}
```

**字段说明**:
- `commandId` (number, 必需): TIJ命令ID (0-255)
- `params` (object, 可选): 命令参数，根据不同命令有不同结构

**响应**:
```json
{
  "success": true,
  "statusCode": 0,
  "data": "1B0600001C1B03A5",
  "statusText": "成功 - 无错误",
  "parsed": {
    "header": "1B06",
    "machineNumber": "00",
    "statusCode": "00",
    "commandId": "1C",
    "data": "",
    "footer": "1B03",
    "checksum": "A5"
  }
}
```

---

### 9. 获取通信日志

**端点**: `GET /api/printer/logs`

**描述**: 获取与喷码机的最近通信记录（最多50条），包含完整的协议解析

**请求参数**: 无

**响应**:
```json
[
  {
    "id": "1734786135456.123",
    "timestamp": "14:32:15",
    "direction": "send",
    "commandId": "0x1C",
    "commandName": "发送信息文件",
    "data": "000024025152010700000000640001002801...",
    "rawHex": "1B02001C000024025152010700000000640001002801...",
    "parsed": {
      "header": "1B02",
      "machineNumber": "00",
      "commandId": "1C",
      "dataLength": "000024",
      "infoName": "QR",
      "moduleType": "07 (图案模块)",
      "data": "025152010700000000...",
      "footer": "1B03",
      "checksum": "91"
    },
    "statusText": null
  },
  {
    "id": "1734786135567.234",
    "timestamp": "14:32:15",
    "direction": "receive",
    "commandId": "0x1C",
    "commandName": "发送信息文件 响应",
    "data": "",
    "rawHex": "1B0600001C1B03A5",
    "parsed": {
      "header": "1B06",
      "machineNumber": "0x00 (机号0)",
      "statusCode": "0x00 (成功 - 无错误)",
      "commandId": "0x1C",
      "data": "无",
      "footer": "1B03",
      "checksum": "A5"
    },
    "statusText": "成功 - 无错误"
  }
]
```

**字段说明**:
- `direction`: "send" (发送) 或 "receive" (接收)
- `commandId`: 命令ID (十六进制字符串)
- `commandName`: 命令名称（中文）
- `data`: 数据内容（十六进制字符串，不含报文头尾和校验码）
- `rawHex`: 原始完整报文（十六进制字符串）
- `parsed`: 解析后的各字段详情
- `statusText`: 状态码说明（仅接收方向有，显示喷码机返回的状态）

---

### 10. 控制导轨移动

**端点**: `POST /api/stepper/move`

**描述**: 控制42步进电机导轨左右移动

**请求体**:
```json
{
  "direction": "left",
  "steps": 100
}
```

**字段说明**:
- `direction` (string, 必需): 移动方向
  - "left": 向左移动
  - "right": 向右移动
- `steps` (number, 必需): 移动步数，建议范围 1-10000

**响应**:
```json
{
  "success": true,
  "position": -100,
  "message": "导轨已向左移动100步"
}
```

**字段说明**:
- `position` (number): 当前相对位置（负数表示左侧，正数表示右侧）

---

### 11. 更新系统设置

**端点**: `POST /api/settings`

**描述**: 更新喷码机TCP连接参数、机号和步进电机GPIO配置

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
- `machineNumber` (number): 机器编号，通常为IP地址最后一个字节
- `stepperDirPin` (number): 步进电机方向控制GPIO引脚
- `stepperStepPin` (number): 步进电机步进信号GPIO引脚（支持PWM）
- `stepperEnablePin` (number): 步进电机使能控制GPIO引脚

**响应**:
```json
{
  "success": true,
  "message": "设置已更新",
  "config": {
    "tcpHost": "169.254.59.119",
    "tcpPort": 139,
    "machineNumber": 119,
    "stepperDirPin": 20,
    "stepperStepPin": 21,
    "stepperEnablePin": 16
  }
}
```

**说明**: 
- 配置保存在服务器内存中
- 修改TCP参数后需要重新连接喷码机
- 修改GPIO引脚后需要重新初始化步进电机

---

### 12. 获取当前设置

**端点**: `GET /api/settings`

**描述**: 获取当前系统配置

**请求参数**: 无

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

### 完整打印流程（推荐）

```
1. 连接喷码机 (POST /api/printer/connect)
   ↓
2. 发送打印内容 (POST /api/printer/print)
   - 命令0x1C: 发送信息文件（图案模块或文本模块）
   - 命令0x01: 更新打印内容到打印区
   ↓
3. 启动喷印 (POST /api/printer/start)
   - 命令0x11: 喷码机进入待打印状态
   ↓
4. 触发打印 (POST /api/printer/trigger)
   - 命令0x13: 模拟光眼信号，执行打印
   - 可多次触发以打印多个
   ↓
5. 停止喷印 (POST /api/printer/stop)
   - 命令0x12: 停止喷码机
   ↓
6. 断开连接 (POST /api/printer/disconnect)
```

### 流程说明

1. **发送内容（命令0x1C + 0x01）**:
   - 0x1C: 上传信息文件到编辑区
     - 二维码: 使用图案模块(0x07)，URL自动转换为位图
     - 文本: 使用文本模块(0x01)
   - 0x01: 将编辑区内容更新到打印区
   - 发送成功后内容已在喷码机准备就绪

2. **启动喷印（命令0x11）**:
   - 喷码机进入工作状态
   - 等待触发信号（光眼或命令）
   - 必须先启动才能打印

3. **触发打印（命令0x13）**:
   - 模拟物理光眼传感器
   - 每次触发打印一个内容单元
   - 可连续触发打印多个
   - 无需物理光眼即可打印

4. **停止喷印（命令0x12）**:
   - 完成打印后停止喷码机
   - 节省能源和墨水
   - 避免误触发

---

## 二维码打印详解

### 图案模块(0x07)工作原理

系统使用图案模块而不是二维码模块(0x04)来打印二维码，流程如下:

```
URL输入 → QR码生成 → 位图转换 → 图案模块发送 → 喷码机打印
```

1. **QR码生成**: 使用 `qrcode` 库将URL转换为PNG图片
2. **位图转换**: 使用 `sharp` 库将PNG转换为单色位图数据
3. **数据打包**: 按照图案模块格式组装数据
4. **协议发送**: 通过命令0x1C发送到喷码机

### 图案模块数据格式

```
模块类型: 07 (图案模块)
X坐标: 2字节 (大端序)
Y坐标: 2字节 (大端序)
缩放比: 1字节 (10~500, 表示10%-500%)
反色选择: 1字节 (0=不反色, 1=反色)
操作类型: 1字节 (0=打开已有图片, 1=发送新图片)
图片宽度: 2字节 (大端序, 像素)
图片高度: 2字节 (大端序, 像素)
图片数据: N字节 (位图数据, 每8个像素1字节)
```

### 参数说明

- **缩放比**: 
  - 10 = 10% (缩小)
  - 100 = 100% (原始大小)
  - 200 = 200% (放大2倍)
  - 范围: 10-500

- **反色选择**:
  - 0 = 正常打印（黑色打印，白色不打印）
  - 1 = 反色打印（白色打印，黑色不打印）

- **操作类型**:
  - 0 = 打开已存在的图片
  - 1 = 发送图片数据并保存（我们使用这个）

- **位图数据格式**:
  - 单色位图，每个像素1位
  - 每8个像素打包成1字节
  - 从左到右，从上到下排列
  - 黑色=1, 白色=0（反色时相反）

### 二维码尺寸计算

用户输入的size参数(1-5)对应不同的二维码尺寸:

| Size | 尺寸(像素) | 说明 | 适用场景 |
|------|----------|------|----------|
| 1 | 100x100 | 很小 | 小标签 |
| 2 | 200x200 | 小 | 产品包装 |
| 3 | 300x300 | 中等 | 推荐，通用 |
| 4 | 400x400 | 大 | 海报、展板 |
| 5 | 500x500 | 很大 | 大幅面打印 |

---

## 硬件连接说明

### 42步进电机连接

**引脚定义**:
```
步进电机驱动器   →   树莓派GPIO
--------------------------------
GND (地线)      →   任意GND引脚
5V (电源)       →   5V电源引脚
DIR (方向)      →   GPIO 20 (可配置)
STEP (步进)     →   GPIO 21 (可配置, PWM)
ENABLE (使能)   →   GPIO 16 (可配置)
```

**GPIO功能**:
- **DIR**: 控制旋转方向 (HIGH=顺时针, LOW=逆时针)
- **STEP**: 步进脉冲信号 (每个脉冲步进一步)
- **ENABLE**: 使能控制 (LOW=使能, HIGH=禁用)

**注意事项**:
- STEP引脚需要支持PWM输出
- 电机驱动器需要独立5V电源供电
- GND必须共地

### 喷码机TCP连接

**网络配置**:
- **IP地址**: 169.254.59.119 (示例，可配置)
- **端口**: 139 (示例，可配置)
- **机号**: 119 (IP最后一个字节，可配置)
- **协议**: TIJ 6.6

**连接要求**:
- 树莓派和喷码机在同一局域网
- 喷码机TCP服务已启用
- 防火墙允许TCP连接

**机号说明**:
- 机号必须与喷码机设置的机号匹配
- 通常等于IP地址的最后一个字节
- 例如: IP=169.254.59.119, 机号=119

---

## TIJ 协议详解

### 常用命令列表

| 命令ID | 十六进制 | 名称 | 功能说明 | 数据要求 |
|--------|---------|------|----------|----------|
| 0 | 0x00 | 握手通信 | 测试连接是否正常 | 无 |
| 1 | 0x01 | 发送打印 | 将编辑区内容更新到打印区 | 可选打印数量 |
| 17 | 0x11 | 启动喷印 | 启动喷码机进入工作状态 | 无 |
| 18 | 0x12 | 停止喷印 | 停止喷码机工作 | 无 |
| 19 | 0x13 | 触发喷印 | 模拟光眼信号触发打印 | 无 |
| 20 | 0x14 | 获取报警 | 获取设备报警状态 | 无 |
| 28 | 0x1C | 发送信息文件 | 上传打印内容到编辑区 | 信息文件数据 |
| 38 | 0x26 | 获取墨盒余量 | 查询墨盒剩余量 | 无 |

### 协议数据格式

#### 请求格式 (REQ)
```
1B 02 [机号] [命令ID] [数据内容] 1B 03 [校验和]
```

**字段说明**:
- `1B 02`: 报文头，表示请求(REQ)
- `机号`: 1字节，喷码机编号
- `命令ID`: 1字节，要执行的命令
- `数据内容`: 0-N字节，命令数据
- `1B 03`: 报文尾，表示数据结束
- `校验和`: 1字节，数据校验

#### 成功响应格式 (ACK)
```
1B 06 [机号] [状态码] [命令ID] [数据内容] 1B 03 [校验和]
```

**字段说明**:
- `1B 06`: 报文头，表示成功应答(ACK)
- `状态码`: 1字节，执行结果状态
- 其他字段同请求格式

#### 失败响应格式 (NAK)
```
1B 15 [机号] [状态码] [命令ID] [数据内容] 1B 03 [校验和]
```

**字段说明**:
- `1B 15`: 报文头，表示失败应答(NAK)
- 其他字段同成功响应

### 校验和计算

校验和使用2补码算法:

```javascript
function calculateChecksum(data) {
  // 1. 计算所有字节的和
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i];
  }
  
  // 2. 取低8位
  sum = sum & 0xFF;
  
  // 3. 计算2补码: (256 - sum) & 0xFF
  const checksum = (0x100 - sum) & 0xFF;
  
  return checksum;
}
```

**示例**:
```
数据: 1B 02 00 1C 00 00 24 ... 1B 03
求和: 1B + 02 + 00 + 1C + ... = 0x156F
取低8位: 0x6F
2补码: 0x100 - 0x6F = 0x91
校验和: 0x91
```

---

## 状态码参考表

### 成功状态 (0x00-0x0F)

| 状态码 | 十六进制 | 说明 |
|--------|---------|------|
| 0 | 0x00 | 成功 - 无错误 |

### 错误状态 (0x01-0xFF)

| 状态码 | 十六进制 | 说明 | 解决方案 |
|--------|---------|------|----------|
| 1 | 0x01 | 喷码机错误 | 检查喷码机状态 |
| 8 | 0x08 | 无效校验码 | 检查数据完整性，系统会自动重试 |
| 10 | 0x0A | 解析失败，未知的模块类型 | 检查模块类型是否正确 |
| 11 | 0x0B | 解析失败，数据长度不匹配 | 检查数据长度字段 |
| 15 | 0x0F | 信息文件已存在 | 使用不同的文件名 |
| 17 | 0x11 | 喷印已启动 | 正常状态 |
| 18 | 0x12 | 喷印未启动 | 需要先执行启动喷印 |
| 20 | 0x14 | 打印间隔过小 | 增加打印间隔时间 |

---

## 使用指南

### 1. 系统配置

#### 1.1 配置TCP连接

1. 打开网页控制面板
2. 点击右上角设置图标 ⚙️
3. 填写TCP连接参数:
   - IP地址: 喷码机的局域网IP
   - 端口: 喷码机TCP端口（通常为139）
   - 机号: IP地址最后一个字节
4. 点击"保存设置"

#### 1.2 配置步进电机

1. 在设置对话框中填写GPIO引脚:
   - 方向引脚: DIR控制引脚
   - 步进引脚: STEP脉冲引脚
   - 使能引脚: ENABLE控制引脚
2. 默认值: DIR=20, STEP=21, ENABLE=16
3. 点击"保存设置"

#### 1.3 启动pigpiod服务

在树莓派上执行:
```bash
sudo pigpiod
sudo systemctl enable pigpiod
```

### 2. 连接喷码机

1. 确保喷码机已开机并连接到网络
2. 使用 `ping 169.254.59.119` 测试网络连通性
3. 在控制面板点击"连接"按钮
4. 等待显示"已连接"状态

### 3. 打印二维码

#### 3.1 输入内容

1. 在"内容设置"选择"二维码"标签页
2. 输入URL链接（例如: https://example.com）
3. 系统自动生成二维码预览

#### 3.2 调整参数

- **打印数量**: 一般不需要设置（命令0x01不使用）
- **二维码大小**: 选择1x-5x，推荐3x或4x
- **X/Y坐标**: 设置二维码在打印区域的位置
- **反色打印**: 深色材质打印时勾选

#### 3.3 执行打印

1. 点击"发送打印"按钮
   - 系统自动将URL转换为二维码位图
   - 通过图案模块(0x07)发送到喷码机
   - 执行命令0x1C和0x01
2. 点击"启动喷印"按钮
   - 喷码机进入工作状态
3. 点击"模拟喷印"按钮
   - 触发打印动作
   - 可多次点击打印多个
4. 完成后点击"停止喷印"

### 4. 打印文本

#### 4.1 输入文本

1. 在"内容设置"选择"文本"标签页
2. 输入要打印的文本内容
3. 支持ASCII字符和中文

#### 4.2 调整参数

- **字体大小**: 5-400像素，推荐24-48
- **旋转角度**: 0°/90°/180°/270°
- **X/Y坐标**: 设置文本位置

#### 4.3 执行打印

流程同二维码打印，按照"发送打印 → 启动喷印 → 模拟喷印 → 停止喷印"的顺序操作。

### 5. 控制导轨

#### 5.1 移动导轨

1. 使用界面上的左右箭头按钮
2. 每次移动100步（可调整）
3. 观察位置指示器实时反馈

#### 5.2 位置显示

- 中央显示当前相对位置
- 负数表示向左移动
- 正数表示向右移动
- 0表示初始位置

### 6. 监控状态

系统实时显示以下信息:

#### 6.1 连接状态
- 已连接: 绿色显示
- 未连接: 灰色显示

#### 6.2 墨盒余量
- 百分比显示 (0-100%)
- 可视化进度条
- 点击刷新按钮手动更新
- 低于20%时显示警告

#### 6.3 CPU温度
- 树莓派板载温度
- 实时更新（20秒间隔）
- 单位: 摄氏度(°C)

#### 6.4 打印状态
- 打印中: 喷印已启动
- 待机: 喷印未启动

### 7. 查看通信日志

通信日志显示所有与喷码机的交互记录:

#### 7.1 日志格式

**发送命令** (蓝色背景):
- 时间戳
- 命令名称和ID
- 发送的数据（十六进制）
- 完整协议解析

**接收响应** (绿色背景):
- 时间戳
- 响应状态
- 接收的数据
- 状态码说明

#### 7.2 协议解析

每条日志包含详细的协议字段解析:
- **报文头**: 1B02 (REQ) 或 1B06 (ACK) 或 1B15 (NAK)
- **机号**: 设备编号
- **状态码**: 执行结果（仅响应有）
- **命令ID**: 命令标识
- **数据**: 命令数据内容
- **报文尾**: 1B03
- **校验码**: 数据校验值

#### 7.3 日志管理

- 最多显示最近50条记录
- 自动滚动到最新记录
- 可复制原始报文用于调试

### 8. 调试面板

调试面板提供所有TIJ协议命令的手动执行功能:

#### 8.1 命令分类

- 基础通信: 握手、查询
- 打印控制: 启动、停止、触发
- 内容设置: 文本、二维码、图案
- 设备设置: 参数配置
- 高级功能: 清洗、复位等

#### 8.2 执行命令

1. 选择命令分类标签页
2. 选择具体命令
3. 输入必要参数（如果有）
4. 点击"执行"按钮
5. 在通信日志查看结果

#### 8.3 常用调试命令

- **握手通信(0x00)**: 测试连接
- **获取墨盒余量(0x26)**: 查询墨水量
- **获取报警(0x14)**: 检查设备状态
- **清洗喷头(0x20)**: 维护喷头
- **复位喷码机(0x0E)**: 重启设备

---

## 故障排除

### 1. 连接问题

#### 问题: 无法连接到喷码机

**可能原因**:
- IP地址配置错误
- 网络不通
- 喷码机未开机
- 端口被占用
- 防火墙阻止

**解决步骤**:
1. 检查IP地址和端口配置
2. 使用 `ping 169.254.59.119` 测试网络
3. 检查喷码机电源和网络连接
4. 确认TCP端口未被其他程序占用
5. 检查防火墙规则:
   ```bash
   sudo ufw allow 139/tcp
   ```

#### 问题: 连接成功但无响应

**可能原因**:
- 机号不匹配
- 协议版本不兼容

**解决步骤**:
1. 确认机号配置正确（通常为IP最后一位）
2. 检查通信日志中的状态码
3. 尝试执行握手命令(0x00)测试
4. 查看喷码机设备设置

### 2. 打印问题

#### 问题: 发送内容成功但不打印

**可能原因**:
- 未启动喷印
- 未触发打印
- 墨盒墨水不足
- 喷头堵塞

**解决步骤**:
1. 确认按照正确流程操作:
   - 发送打印 → 启动喷印 → 模拟喷印
2. 检查墨盒余量是否充足
3. 查看通信日志确认所有命令成功
4. 使用调试面板执行清洗喷头命令
5. 检查喷码机是否有报警（命令0x14）

#### 问题: 二维码打印空白

**可能原因**:
- URL为空或无效
- 二维码生成失败
- 位图转换错误
- 坐标超出打印范围

**解决步骤**:
1. 确认URL输入正确且有预览显示
2. 检查浏览器控制台是否有错误
3. 查看服务器日志中的位图转换信息
4. 调整X/Y坐标到有效范围（0-1000）
5. 尝试不同的size参数

#### 问题: 文本打印成功，二维码失败

**可能原因**:
- 图案模块数据格式错误
- 位图数据过大
- 操作类型设置错误

**解决步骤**:
1. 检查通信日志中图案模块数据
2. 减小二维码尺寸（使用size=1或2）
3. 查看服务器日志的详细错误信息
4. 确认操作类型为1（发送新图片）

### 3. 协议错误

#### 错误: 状态码 0x08 (无效校验码)

**说明**: 校验码计算错误，数据传输可能有问题

**解决方案**:
- 系统会自动重试
- 检查网络稳定性
- 查看通信日志确认数据完整性
- 如果频繁出现，检查TCP连接质量

#### 错误: 状态码 0x0A (未知的模块类型)

**说明**: 喷码机无法识别模块类型

**解决方案**:
- 检查发送的模块类型字段
- 二维码应使用图案模块(0x07)
- 文本应使用文本模块(0x01)
- 查看通信日志的完整数据

#### 错误: 状态码 0x12 (喷印未启动)

**说明**: 尝试触发打印但喷码机未启动

**解决方案**:
- 先执行启动喷印命令(0x11)
- 等待启动成功（状态变为"打印中"）
- 再执行模拟喷印命令(0x13)

#### 错误: 状态码 0x14 (打印间隔过小)

**说明**: 连续触发打印过快

**解决方案**:
- 增加触发打印的间隔时间
- 等待上一次打印完成再触发
- 检查喷码机设置的最小打印间隔

### 4. 步进电机问题

#### 问题: 步进电机不动

**可能原因**:
- pigpiod服务未启动
- GPIO引脚连接错误
- 电机驱动器未通电
- 引脚配置错误

**解决步骤**:
1. 检查pigpiod服务状态:
   ```bash
   sudo systemctl status pigpiod
   sudo systemctl start pigpiod
   ```
2. 确认GPIO引脚接线正确
3. 检查电机驱动器5V电源
4. 验证GPIO引脚配置:
   ```bash
   gpio readall  # 查看引脚状态
   ```
5. 查看服务器日志的GPIO错误信息

#### 问题: 步进电机运动不正常

**可能原因**:
- 电机驱动器细分设置
- 电源电压不足
- 负载过大

**解决步骤**:
- 检查电机驱动器的细分开关设置
- 确认5V电源供电充足
- 减小移动步数测试
- 检查导轨是否有卡顿

### 5. 系统问题

#### 问题: CPU温度显示为0

**可能原因**:
- 温度文件不存在
- 非树莓派系统
- 权限不足

**解决步骤**:
1. 检查温度文件:
   ```bash
   cat /sys/class/thermal/thermal_zone0/temp
   ```
2. 确认运行在树莓派上
3. 检查文件读取权限
4. 查看服务器日志的温度读取信息

#### 问题: 页面刷新后配置丢失

**说明**: 配置存储在浏览器localStorage中

**解决方案**:
- 使用同一浏览器和设备访问
- 不要清除浏览器缓存
- 每次修改后确认点击"保存设置"
- 服务器端配置会在重启后丢失，需要重新配置

#### 问题: 通信日志不更新

**可能原因**:
- 浏览器标签页未激活
- SWR缓存问题

**解决方案**:
- 切换到日志标签页激活更新
- 刷新页面重新加载
- 检查浏览器控制台是否有错误

---

## 高级功能

### 1. 批量打印

虽然当前命令0x01不支持数量参数，但可以通过循环调用触发喷印命令(0x13)实现批量打印:

```javascript
// 打印10个二维码
for (let i = 0; i < 10; i++) {
  await fetch('/api/printer/trigger', { method: 'POST' });
  await new Promise(resolve => setTimeout(resolve, 1000)); // 延迟1秒
}
```

### 2. 自动打印流程

创建自动化打印脚本:

```javascript
async function autoPrint(url, count) {
  // 1. 发送内容
  await fetch('/api/printer/print', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'qrcode',
      url: url,
      size: 3,
      x: 0,
      y: 0
    })
  });
  
  // 2. 启动喷印
  await fetch('/api/printer/start', { method: 'POST' });
  
  // 3. 循环触发打印
  for (let i = 0; i < count; i++) {
    await fetch('/api/printer/trigger', { method: 'POST' });
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 4. 停止喷印
  await fetch('/api/printer/stop', { method: 'POST' });
}

// 使用
autoPrint('https://example.com', 10);
```

### 3. 导轨自动化

实现导轨自动扫描:

```javascript
async function scanRail(steps, count) {
  for (let i = 0; i < count; i++) {
    // 向右移动
    await fetch('/api/stepper/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        direction: 'right',
        steps: steps
      })
    });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 触发打印
    await fetch('/api/printer/trigger', { method: 'POST' });
    
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // 返回原位
  await fetch('/api/stepper/move', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      direction: 'left',
      steps: steps * count
    })
  });
}

// 使用: 每隔100步打印一次，共5次
scanRail(100, 5);
```

### 4. 状态监控脚本

持续监控设备状态:

```javascript
async function monitorStatus() {
  setInterval(async () => {
    const response = await fetch('/api/printer/status');
    const status = await response.json();
    
    console.log('=== 设备状态 ===');
    console.log('连接:', status.connected ? '✓' : '✗');
    console.log('墨盒:', status.cartridgeLevel + '%');
    console.log('温度:', status.cpuTemperature + '°C');
    console.log('打印:', status.printing ? '进行中' : '待机');
    
    // 墨盒余量低于20%时报警
    if (status.cartridgeLevel < 20) {
      console.warn('⚠️ 墨盒余量不足，请更换！');
    }
    
    // CPU温度高于80°C时报警
    if (status.cpuTemperature > 80) {
      console.warn('⚠️ CPU温度过高！');
    }
  }, 5000); // 每5秒检查一次
}

// 启动监控
monitorStatus();
```

---

## 开发指南

### 部署到树莓派

1. **安装系统依赖**:
```bash
# 安装 Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 pigpio
sudo apt-get install pigpio

# 启动 pigpiod 服务
sudo pigpiod
sudo systemctl enable pigpiod
```

2. **克隆项目**:
```bash
git clone <项目地址>
cd printer-control
```

3. **安装依赖**:
```bash
npm install
```

4. **构建项目**:
```bash
npm run build
```

5. **启动服务**:
```bash
npm start
# 或使用 PM2 守护进程
pm2 start npm --name "printer" -- start
pm2 save
pm2 startup
```

6. **访问界面**:
```
http://<树莓派IP>:3000
```

### 环境变量

在 `.env.local` 文件中配置:

```env
# 默认TCP配置
DEFAULT_TCP_HOST=169.254.59.119
DEFAULT_TCP_PORT=139
DEFAULT_MACHINE_NUMBER=119

# 默认GPIO配置
DEFAULT_STEPPER_DIR_PIN=20
DEFAULT_STEPPER_STEP_PIN=21
DEFAULT_STEPPER_ENABLE_PIN=16

# 日志级别
LOG_LEVEL=info
```

### 日志

服务器日志位置:
- 开发环境: 控制台输出
- 生产环境: PM2日志 (`pm2 logs printer`)

查看日志:
```bash
# PM2日志
pm2 logs printer

# 系统日志
journalctl -u printer -f
```

---

## 示例代码

### 完整的打印流程 (JavaScript)

```javascript
class PrinterClient {
  constructor(baseURL = 'http://localhost:3000/api') {
    this.baseURL = baseURL;
  }
  
  async connect() {
    const response = await fetch(`${this.baseURL}/printer/connect`, {
      method: 'POST'
    });
    return response.json();
  }
  
  async disconnect() {
    const response = await fetch(`${this.baseURL}/printer/disconnect`, {
      method: 'POST'
    });
    return response.json();
  }
  
  async printQRCode(url, options = {}) {
    const {
      size = 3,
      x = 0,
      y = 0,
      inverse = false
    } = options;
    
    const response = await fetch(`${this.baseURL}/printer/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'qrcode',
        url,
        size,
        x,
        y,
        inverse
      })
    });
    return response.json();
  }
  
  async printText(content, options = {}) {
    const {
      size = 24,
      x = 0,
      y = 0,
      rotation = 0
    } = options;
    
    const response = await fetch(`${this.baseURL}/printer/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'text',
        content,
        size,
        x,
        y,
        rotation
      })
    });
    return response.json();
  }
  
  async start() {
    const response = await fetch(`${this.baseURL}/printer/start`, {
      method: 'POST'
    });
    return response.json();
  }
  
  async stop() {
    const response = await fetch(`${this.baseURL}/printer/stop`, {
      method: 'POST'
    });
    return response.json();
  }
  
  async trigger() {
    const response = await fetch(`${this.baseURL}/printer/trigger`, {
      method: 'POST'
    });
    return response.json();
  }
  
  async getStatus() {
    const response = await fetch(`${this.baseURL}/printer/status`);
    return response.json();
  }
  
  async getLogs() {
    const response = await fetch(`${this.baseURL}/printer/logs`);
    return response.json();
  }
  
  async moveRail(direction, steps) {
    const response = await fetch(`${this.baseURL}/stepper/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction, steps })
    });
    return response.json();
  }
}

// 使用示例
async function main() {
  const printer = new PrinterClient();
  
  try {
    // 连接
    await printer.connect();
    console.log('✓ 已连接');
    
    // 打印二维码
    await printer.printQRCode('https://example.com', {
      size: 3,
      x: 0,
      y: 0
    });
    console.log('✓ 内容已发送');
    
    // 启动喷印
    await printer.start();
    console.log('✓ 喷印已启动');
    
    // 触发打印3次
    for (let i = 0; i < 3; i++) {
      await printer.trigger();
      console.log(`✓ 已打印 ${i + 1}/3`);
      await new Promise(r => setTimeout(r, 1000));
    }
    
    // 停止喷印
    await printer.stop();
    console.log('✓ 喷印已停止');
    
    // 移动导轨
    await printer.moveRail('right', 100);
    console.log('✓ 导轨已移动');
    
    // 断开连接
    await printer.disconnect();
    console.log('✓ 已断开');
    
  } catch (error) {
    console.error('✗ 错误:', error.message);
  }
}

main();
```

### 使用 Python 调用API

```python
import requests
import time

class PrinterClient:
    def __init__(self, base_url='http://localhost:3000/api'):
        self.base_url = base_url
    
    def connect(self):
        response = requests.post(f'{self.base_url}/printer/connect')
        return response.json()
    
    def disconnect(self):
        response = requests.post(f'{self.base_url}/printer/disconnect')
        return response.json()
    
    def print_qrcode(self, url, size=3, x=0, y=0, inverse=False):
        data = {
            'type': 'qrcode',
            'url': url,
            'size': size,
            'x': x,
            'y': y,
            'inverse': inverse
        }
        response = requests.post(
            f'{self.base_url}/printer/print',
            json=data
        )
        return response.json()
    
    def print_text(self, content, size=24, x=0, y=0, rotation=0):
        data = {
            'type': 'text',
            'content': content,
            'size': size,
            'x': x,
            'y': y,
            'rotation': rotation
        }
        response = requests.post(
            f'{self.base_url}/printer/print',
            json=data
        )
        return response.json()
    
    def start(self):
        response = requests.post(f'{self.base_url}/printer/start')
        return response.json()
    
    def stop(self):
        response = requests.post(f'{self.base_url}/printer/stop')
        return response.json()
    
    def trigger(self):
        response = requests.post(f'{self.base_url}/printer/trigger')
        return response.json()
    
    def get_status(self):
        response = requests.get(f'{self.base_url}/printer/status')
        return response.json()
    
    def move_rail(self, direction, steps):
        data = {'direction': direction, 'steps': steps}
        response = requests.post(
            f'{self.base_url}/stepper/move',
            json=data
        )
        return response.json()

# 使用示例
if __name__ == '__main__':
    printer = PrinterClient()
    
    try:
        # 连接
        printer.connect()
        print('✓ 已连接')
        
        # 打印二维码
        printer.print_qrcode('https://example.com', size=3)
        print('✓ 内容已发送')
        
        # 启动喷印
        printer.start()
        print('✓ 喷印已启动')
        
        # 触发打印5次
        for i in range(5):
            printer.trigger()
            print(f'✓ 已打印 {i+1}/5')
            time.sleep(1)
        
        # 停止喷印
        printer.stop()
        print('✓ 喷印已停止')
        
        # 断开连接
        printer.disconnect()
        print('✓ 已断开')
        
    except Exception as e:
        print(f'✗ 错误: {e}')
```

---

## 附录

### A. TIJ协议命令完整列表

| ID | 十六进制 | 名称 | 数据 |
|----|---------|------|------|
| 0 | 0x00 | 握手通信 | 无 |
| 1 | 0x01 | 发送打印 | 可选 |
| 14 | 0x0E | 复位喷码机 | 无 |
| 17 | 0x11 | 启动喷印 | 无 |
| 18 | 0x12 | 停止喷印 | 无 |
| 19 | 0x13 | 触发喷印 | 无 |
| 20 | 0x14 | 获取报警 | 无 |
| 28 | 0x1C | 发送信息文件 | 信息文件 |
| 32 | 0x20 | 清洗喷头 | 无 |
| 38 | 0x26 | 获取墨盒余量 | 无 |
| 40 | 0x28 | 设置喷印模式 | 模式值 |
| 41 | 0x29 | 获取喷印模式 | 无 |

### B. GPIO引脚图 (树莓派4B)

```
    3V3  (1) (2)  5V
  GPIO2  (3) (4)  5V
  GPIO3  (5) (6)  GND
  GPIO4  (7) (8)  GPIO14
    GND  (9) (10) GPIO15
 GPIO17 (11) (12) GPIO18
 GPIO27 (13) (14) GND
 GPIO22 (15) (16) GPIO23  ← ENABLE (默认)
    3V3 (17) (18) GPIO24
 GPIO10 (19) (20) GND     ← DIR (默认)
  GPIO9 (21) (22) GPIO25
 GPIO11 (23) (24) GPIO8
    GND (25) (26) GPIO7
  GPIO0 (27) (28) GPIO1
  GPIO5 (29) (30) GND
  GPIO6 (31) (32) GPIO12
 GPIO13 (33) (34) GND
 GPIO19 (35) (36) GPIO16
 GPIO26 (37) (38) GPIO20
    GND (39) (40) GPIO21  ← STEP (默认)
```

### C. 常见错误代码快速查询

| 问题现象 | 可能原因 | 快速解决 |
|---------|---------|---------|
| 连接失败 | 网络不通 | ping测试 |
| 校验码错误(0x08) | 数据损坏 | 自动重试 |
| 模块类型错误(0x0A) | 格式错误 | 检查模块类型 |
| 喷印未启动(0x12) | 流程错误 | 先启动喷印 |
| 打印无输出 | 未触发 | 执行模拟喷印 |
| 二维码空白 | URL错误 | 检查URL和预览 |
| 步进电机不动 | pigpiod未启动 | sudo pigpiod |
| 温度显示0 | 非树莓派 | 检查设备类型 |

### D. 技术支持

如遇到本文档未涵盖的问题，请:

1. 检查浏览器控制台(F12)的错误信息
2. 查看服务器日志获取详细错误
3. 检查通信日志了解协议交互
4. 参考TIJ协议文档进行调试
5. 联系技术支持团队

---

**文档版本**: 1.0  
**最后更新**: 2024-12-21  
**适用系统**: 喷码机控制系统 v1.0  
**协议版本**: TIJ 6.6
