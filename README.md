# TIJ 喷码机控制系统

基于树莓派的喷码机控制系统，支持二维码打印、步进电机导轨控制和实时状态监控。

## 快速开始

**完整安装指南请参阅: [INSTALL.md](./INSTALL.md)**

### 功能特性

1. **二维码打印** - 输入URL自动生成二维码并批量打印
2. **导轨控制** - 42步进电机精确控制喷码机移动
3. **实时监控** - 显示连接状态、墨盒余量、CPU温度
4. **通信日志** - 美观显示所有发送/接收的命令数据
5. **可视化配置** - 网页界面配置TCP连接、GPIO引脚

### 系统截图

![主界面](./docs/screenshot.png)

---

## 硬件连接

### 喷码机
- **连接方式**: TCP/IP
- **默认地址**: 192.168.1.100:9100 (可在界面配置)

### 步进电机 (42步进电机)
```
树莓派引脚 → 步进电机驱动器
Pin 2  (5V)     → VCC
Pin 6  (GND)    → GND
Pin 36 (GPIO16) → EN  (使能)
Pin 38 (GPIO20) → DIR (方向)
Pin 40 (GPIO21) → STEP (步进)
```

---

## 快速安装

### 1. 安装系统依赖
```bash
# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential python3

# pigpio (GPIO控制)
sudo apt-get install -y pigpio
sudo pigpiod
sudo systemctl enable pigpiod
```

### 2. 安装项目
```bash
# 克隆项目
git clone <repository-url> printer-control
cd printer-control

# 安装依赖
npm install
```

### 3. 启动应用
```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start

# 访问: http://<树莓派IP>:3000
```

---

## API 接口文档

完整的API文档请参阅: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### 主要接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/printer/status` | GET | 获取打印机状态 |
| `/api/printer/print` | POST | 发送打印任务 |
| `/api/printer/start` | POST | 启动喷印 |
| `/api/printer/stop` | POST | 停止喷印 |
| `/api/printer/logs` | GET | 获取通信日志 |
| `/api/stepper/move` | POST | 控制导轨移动 |
| `/api/settings` | GET/POST | 配置管理 |

---

## 使用说明

### 1. 配置连接
点击右上角设置图标 ⚙️，配置:
- TCP IP地址: `192.168.1.100`
- TCP端口: `9100`
- GPIO引脚: EN(16), DIR(20), STEP(21)

### 2. 打印二维码
1. 输入URL链接 (如: `https://example.com`)
2. 设置打印数量
3. 点击"发送打印"
4. 在通信日志中查看执行过程

### 3. 控制导轨
- 点击"向左移动"或"向右移动"
- 步进电机会带动导轨移动
- 位置指示器显示当前位置

### 4. 监控状态
- 🟢 喷头状态: 显示连接状态
- 📦 墨盒余量: 百分比显示
- 🌡️ CPU温度: 树莓派板子温度

---

## TIJ 协议说明

### 常用命令

| 命令ID | 名称 | 功能 |
|--------|------|------|
| 0x01 | 发送打印 | 更新打印内容 |
| 0x11 | 启动喷印 | 启动喷码机 |
| 0x12 | 停止喷印 | 停止喷码机 |
| 0x13 | 触发喷印 | 触发一次打印 |
| 0x14 | 获取报警 | 获取报警状态 |
| 0x1C | 发送信息 | 发送二维码数据 |
| 0x26 | 获取墨盒 | 获取墨盒余量 |

### 数据格式
```
命令: 1B 02 [机号] [命令ID] [数据] 1B 03 [校验]
响应: 1B 06 [机号] [状态] [命令ID] [数据] 1B 03 [校验]
```

---

## 故障排除

### GPIO 初始化失败
```bash
sudo pigpiod
sudo systemctl status pigpiod
```

### TCP连接失败
- 检查喷码机IP地址是否正确
- 确认网络连接正常
- 使用 `ping` 命令测试连通性
- 检查防火墙设置

### 更多问题
请查看完整的 [INSTALL.md](./INSTALL.md) 文档

---

## 技术栈

- **前端**: Next.js 16 + React 19 + Tailwind CSS v4
- **UI**: shadcn/ui + Lucide Icons
- **通信**: Node.js net (TCP)
- **GPIO**: pigpio
- **状态**: SWR

---

## 项目结构

```
printer-control/
├── app/
│   ├── page.tsx              # 主界面
│   ├── api/
│   │   ├── printer/          # 喷码机API
│   │   ├── stepper/          # 步进电机API
│   │   └── settings/         # 配置API
│   └── globals.css           # 全局样式
├── lib/
│   ├── printer.ts            # 喷码机控制 (TCP)
│   ├── stepper.ts            # 步进电机控制
│   └── swr.ts                # SWR配置
├── components/ui/            # UI组件库
├── INSTALL.md                # 安装指南
├── API_DOCUMENTATION.md      # API文档
└── README.md                 # 项目说明
```

---

## 开发指南

### 添加新命令
在 `lib/printer.ts` 中添加:
```typescript
export async function myNewCommand() {
  const response = await sendCommand(0xXX, "Command Name", dataBuffer)
  return response
}
```

### 添加新API
在 `app/api/` 下创建新路由:
```typescript
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  // 处理逻辑
  return NextResponse.json({ success: true })
}
```

---

## 许可证

MIT License

---

## 相关资源

- [完整安装指南](./INSTALL.md)
- [API接口文档](./API_DOCUMENTATION.md)
- [TIJ协议文档](./docs/TIJ_通讯协议6.6无屏机.pdf)
- [树莓派GPIO引脚图](https://pinout.xyz/)
- [pigpio文档](http://abyz.me.uk/rpi/pigpio/)

---

**需要帮助?** 请查看 [INSTALL.md](./INSTALL.md) 中的故障排除章节。
