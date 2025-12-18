# TIJ 喷码机控制系统

基于树莓派的喷码机控制系统，支持二维码打印、步进电机导轨控制和实时状态监控。

## 功能特性

### 1. 二维码打印
- 输入URL链接自动生成二维码
- 支持批量打印（设置打印数量）
- 实时显示打印状态

### 2. 步进电机导轨控制
- 42步进电机驱动导轨左右移动
- 可视化位置指示器
- 精确位置控制

### 3. 实时状态监控
- 喷头连接状态
- 墨盒剩余量显示
- 树莓派CPU温度监控
- 打印状态实时更新

### 4. 通信日志
- 实时显示发送和接收的数据
- HEX格式原始数据显示
- 命令名称和ID对应
- 美观的一一对应显示

## 硬件连接

### 喷码机连接
- **接口**: RS232串口 (通过USB转RS232)
- **端口**: /dev/ttyUSB0
- **波特率**: 115200
- **数据位**: 8
- **停止位**: 1
- **校验位**: None

### 步进电机连接 (42步进电机)
- **GND**: 树莓派GND (Pin 6)
- **VCC**: 5V电源 (Pin 2)
- **DIR**: GPIO 20 (Pin 38) - 方向控制
- **STEP**: GPIO 21 (Pin 40) - PWM步进信号
- **EN**: GPIO 16 (Pin 36) - 使能控制

### 接线图
```
树莓派 GPIO 引脚布局:
┌─────┬─────┐
│ 1 2 │     │  Pin 2: 5V → 步进电机驱动器 VCC
│ 3 4 │     │
│ 5 6 │     │  Pin 6: GND → 步进电机驱动器 GND
│...  │     │
│35 36│     │  Pin 36 (GPIO16) → 步进电机 EN
│37 38│     │  Pin 38 (GPIO20) → 步进电机 DIR
│39 40│     │  Pin 40 (GPIO21) → 步进电机 STEP
└─────┴─────┘
```

## 系统要求

### 树莓派系统
- Raspberry Pi 3/4/5
- Raspbian OS / Raspberry Pi OS
- Node.js 18+

### 依赖包安装
```bash
# 安装 Node.js (如果没有)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 pigpio 库 (GPIO控制)
sudo apt-get install pigpio

# 安装项目依赖
npm install
```

## 安装部署

### 1. 克隆项目
```bash
git clone <repository-url>
cd tij-printer-control
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置串口权限
```bash
# 将当前用户添加到 dialout 组
sudo usermod -a -G dialout $USER

# 重启或重新登录使权限生效
sudo reboot
```

### 4. 配置GPIO权限
```bash
# 启动 pigpio 守护进程
sudo pigpiod

# 设置开机自启动
sudo systemctl enable pigpiod
sudo systemctl start pigpiod
```

### 5. 启动应用
```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm run start
```

### 6. 访问系统
打开浏览器访问: `http://<树莓派IP>:3000`

## API 接口文档

### 1. 获取打印机状态
**GET** `/api/printer/status`

返回打印机当前状态信息。

**响应示例:**
```json
{
  "connected": true,
  "cartridgeLevel": 85,
  "cpuTemperature": 45.2,
  "printing": false,
  "error": null
}
```

**字段说明:**
- `connected`: 喷码机连接状态 (boolean)
- `cartridgeLevel`: 墨盒余量百分比 (0-100)
- `cpuTemperature`: CPU温度 (摄氏度)
- `printing`: 是否正在打印 (boolean)
- `error`: 错误信息 (string | null)

---

### 2. 发送打印任务
**POST** `/api/printer/print`

发送二维码打印任务到喷码机。

**请求体:**
```json
{
  "url": "https://example.com",
  "quantity": 10
}
```

**参数说明:**
- `url`: 要生成二维码的URL链接 (string, 必填)
- `quantity`: 打印数量 (number, 必填, 最小值1)

**响应示例:**
```json
{
  "success": true
}
```

---

### 3. 启动喷印
**POST** `/api/printer/start`

启动喷码机喷印功能。

**响应示例:**
```json
{
  "success": true
}
```

---

### 4. 停止喷印
**POST** `/api/printer/stop`

停止喷码机喷印功能。

**响应示例:**
```json
{
  "success": true
}
```

---

### 5. 获取通信日志
**GET** `/api/printer/logs`

获取最近的通信日志记录。

**响应示例:**
```json
[
  {
    "id": "1703001234567",
    "timestamp": "14:30:25",
    "direction": "send",
    "commandId": "0x01",
    "commandName": "Send Print",
    "data": "",
    "rawHex": "1B020001001B03B3"
  },
  {
    "id": "1703001234568",
    "timestamp": "14:30:26",
    "direction": "receive",
    "commandId": "0x01",
    "commandName": "Send Print Response",
    "data": "",
    "rawHex": "1B060000011B03B2"
  }
]
```

**字段说明:**
- `id`: 日志唯一标识
- `timestamp`: 时间戳
- `direction`: 方向 ("send" | "receive")
- `commandId`: 命令ID (HEX格式)
- `commandName`: 命令名称
- `data`: 数据内容 (UTF-8)
- `rawHex`: 原始十六进制数据

---

### 6. 移动导轨
**POST** `/api/stepper/move`

控制步进电机移动导轨。

**请求体:**
```json
{
  "direction": "right",
  "steps": 100
}
```

**参数说明:**
- `direction`: 移动方向 ("left" | "right", 必填)
- `steps`: 步进数量 (number, 必填)

**响应示例:**
```json
{
  "success": true,
  "position": 100
}
```

**字段说明:**
- `success`: 操作是否成功
- `position`: 当前位置 (相对初始位置的步数)

---

## TIJ 协议命令参考

### 常用命令列表

| 命令ID | 命令名称 | 功能描述 |
|--------|----------|----------|
| 0x01 | 发送打印 | 更新当前编辑区内容到打印内容 |
| 0x11 | 启动喷印 | 启动喷码机喷印功能 |
| 0x12 | 停止喷印 | 停止喷码机喷印功能 |
| 0x13 | 触发喷印 | 模拟光眼信号触发一次打印 |
| 0x14 | 获取报警状态 | 获取喷码机当前报警状态 |
| 0x1C | 发送信息文件 | 发送完整打印信息(包括二维码) |
| 0x26 | 获取墨盒余量 | 获取墨盒剩余量百分比 |

### 报文格式

**命令格式:**
```
1B 02 [机号] [命令ID] [数据] 1B 03 [校验码]
```

**响应格式:**
```
1B 06 [机号] [状态码] [命令ID] [数据] 1B 03 [校验码]
```

### 校验码计算

校验码 = 0x100 - (所有字节之和 & 0xFF)

**示例:**
```
数据: 1B 02 00 01 1B 03
求和: 1B + 02 + 00 + 01 + 1B + 03 = 3C
校验: 0x100 - (0x3C & 0xFF) = 0xC4
```

---

## 故障排除

### 1. 串口连接失败
**问题:** Cannot open /dev/ttyUSB0

**解决方案:**
```bash
# 检查串口设备
ls -l /dev/ttyUSB*

# 检查权限
sudo chmod 666 /dev/ttyUSB0

# 或添加用户到 dialout 组
sudo usermod -a -G dialout $USER
```

### 2. GPIO 权限错误
**问题:** GPIO initialization failed

**解决方案:**
```bash
# 启动 pigpio 守护进程
sudo pigpiod

# 检查服务状态
sudo systemctl status pigpiod
```

### 3. 喷码机无响应
**问题:** Printer not responding

**检查项:**
- 确认串口连接正常
- 检查波特率设置 (默认115200)
- 确认机号设置正确 (默认0x00)
- 检查喷码机是否通电并启动

### 4. 步进电机不转动
**问题:** Stepper motor not moving

**检查项:**
- 确认GPIO引脚连接正确
- 检查5V电源是否充足
- 确认pigpio守护进程已启动
- 检查步进电机驱动器使能信号

---

## 技术架构

### 前端
- **框架**: Next.js 16 + React 19
- **样式**: Tailwind CSS v4
- **UI组件**: shadcn/ui
- **数据获取**: SWR

### 后端
- **运行时**: Node.js
- **串口通信**: serialport
- **GPIO控制**: pigpio
- **API**: Next.js API Routes

### 硬件
- **主控**: Raspberry Pi (3/4/5)
- **喷码机**: TIJ喷码机 (RS232接口)
- **步进电机**: 42步进电机 (NEMA17)
- **驱动器**: A4988/DRV8825 或兼容驱动

---

## 安全注意事项

1. **电源安全**: 确保5V电源供电充足，避免电压不稳
2. **静电防护**: 操作GPIO前应做好静电防护
3. **权限管理**: 生产环境应限制GPIO和串口访问权限
4. **运动安全**: 步进电机运动前确认导轨无障碍物

---

## 许可证

MIT License

---

## 联系支持

如遇问题，请查阅:
1. TIJ通讯协议文档 (TIJ_通讯协议6.6无屏机.pdf)
2. 树莓派GPIO文档: https://www.raspberrypi.org/documentation/
3. pigpio库文档: http://abyz.me.uk/rpi/pigpio/
