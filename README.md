# TIJ 喷码机控制系统

基于树莓派的喷码机控制系统，支持TCP网络连接、二维码/文本打印、步进电机导轨控制和实时状态监控。

## 核心功能

### 1. 内容编辑与打印
- **二维码打印** - 输入URL生成QR码，支持自定义大小、容错级别、位置
- **文本打印** - 自定义文本内容、字体大小、旋转角度、位置
- **批量打印** - 设置打印数量，自动批量执行
- **位置控制** - 精确设置X/Y坐标定位打印内容

### 2. 调试面板（完整TIJ协议支持）
提供所有TIJ 6.6协议命令的图形化界面，按功能分类：
- **基本命令** - 握手通信、发送打印、加锁解锁
- **计数器管理** - 获取/复位打印计数、产品计数、序列号
- **打印控制** - 启动/停止/触发喷印、报警管理
- **字体设置** - 字体名称、大小、间距
- **内容管理** - 信息文件、字段数据、信息库
- **打印模式** - 标准/连续/计数/编组模式、闪喷设置
- **喷头设置** - 清洗、余量查询、喷嘴选择、灰度/电压/脉宽
- **传感器设置** - 光眼电平、编码器分辨率、打印延迟
- **翻转控制** - 左右翻转、上下颠倒、扫描方向
- **字段管理** - 远端字段缓存管理
- **文件操作** - 发送文件到喷码机
- **系统信息** - 墨盒唯一标识

### 3. 导轨控制
- **42步进电机** - 精确控制喷码机在导轨上移动
- **方向控制** - 左右移动，实时位置反馈
- **可视化指示** - 位置指示器显示当前位置

### 4. 实时监控
- **连接状态** - 显示TCP连接状态，手动连接/断开
- **墨盒余量** - 实时查询墨盒剩余量（百分比+进度条）
- **CPU温度** - 树莓派板子温度监控
- **打印状态** - 显示当前是否在打印

### 5. 通信日志
- **实时记录** - 所有发送/接收的命令自动记录
- **协议解析** - 自动解析报文头、机号、状态码、数据、校验码
- **美观展示** - 发送命令（蓝色）、接收响应（绿色）分色显示
- **状态翻译** - 自动翻译状态码为中文说明

### 6. 灵活配置
- **TCP设置** - 可配置IP地址、端口、机号
- **GPIO设置** - 可配置步进电机的DIR/STEP/ENABLE引脚
- **本地存储** - 配置自动保存到浏览器localStorage

---

## 快速开始

### 系统要求
- 树莓派 3B+ 或更高版本
- Node.js 18+
- 喷码机支持TCP网络连接

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

## 硬件连接

### 喷码机连接
- **连接方式**: TCP/IP网络连接
- **默认配置**: 
  - IP地址: 169.254.59.119
  - 端口: 139
  - 机号: 119 (IP最后一个字节)

### 步进电机连接（42步进电机）
```
树莓派引脚        →  步进电机驱动器
Pin 2  (5V)      →  VCC (电源)
Pin 6  (GND)     →  GND (接地)
Pin 36 (GPIO16)  →  EN  (使能控制)
Pin 38 (GPIO20)  →  DIR (方向控制)
Pin 40 (GPIO21)  →  STEP (步进信号/PWM)
```

---

## 使用指南

### 初次配置

1. **打开设置面板**
   - 点击右上角设置图标 ⚙️
   
2. **配置喷码机TCP连接**
   - IP地址：输入喷码机的IP（如：169.254.59.119）
   - 端口：输入TCP端口（如：139）
   - 机号：通常为IP地址最后一个字节的十进制值（如：119）

3. **配置步进电机GPIO**
   - DIR引脚：方向控制（默认：20）
   - STEP引脚：步进信号（默认：21）
   - ENABLE引脚：使能控制（默认：16）

4. **保存设置**
   - 点击"保存设置"按钮
   - 系统会自动断开旧连接并应用新配置

### 打印二维码

1. 在"内容设置"卡片中选择"二维码"标签
2. 输入URL链接（如：https://example.com）
3. 设置参数：
   - 打印数量：要打印的份数
   - 二维码大小：1-4级别
   - X/Y坐标：在打印区域的位置
   - 容错级别：L/M/Q/H（数据损坏容错能力）
4. 点击"发送打印"按钮
5. 在通信日志中查看执行结果

### 打印文本

1. 在"内容设置"卡片中选择"文本"标签
2. 输入文本内容
3. 设置参数：
   - 字体大小：5-400范围
   - X/Y坐标：在打印区域的位置
   - 旋转角度：0°/90°/180°/270°
4. 点击"发送打印"按钮

### 控制喷印

- **启动喷印**：点击"启动喷印"按钮，喷码机开始工作
- **停止喷印**：点击"停止喷印"按钮，喷码机停止工作
- 必须先发送打印内容，再启动喷印

### 使用调试面板

1. 点击右上角调试图标 🐛
2. 选择命令分类标签页
3. 查看所有可用命令及其说明
4. 如需输入参数，填写相应字段
5. 点击"执行"按钮发送命令
6. 查看通信日志获取详细响应

### 控制导轨

- **向左移动**：点击左箭头按钮
- **向右移动**：点击右箭头按钮
- **查看位置**：中央显示当前位置数值
- **位置指示器**：可视化显示导轨位置

### 监控状态

**自动监控（每20秒）**：
- 连接状态
- CPU温度

**手动刷新**：
- 墨盒余量：点击刷新按钮 🔄

### 查看通信日志

通信日志自动显示所有与喷码机的交互：

**发送命令（蓝色）**：
- 显示命令名称、命令ID
- 协议解析：报文头、机号、命令ID、数据、报文尾、校验码
- 原始十六进制数据

**接收响应（绿色）**：
- 显示命令名称、命令ID
- 状态码及中文说明（成功/错误信息）
- 完整协议解析
- 原始十六进制数据

---

## TIJ 协议说明

### 命令格式
```
发送: 1B 02 [机号] [命令ID] [数据] 1B 03 [校验码]
响应: 1B 06 [机号] [状态码] [命令ID] [数据] 1B 03 [校验码]
```

### 校验码计算
```
校验码 = (0x100 - (所有字节之和 & 0xFF)) & 0xFF
```

### 常用命令

| 命令ID | 名称 | 功能说明 |
|--------|------|----------|
| 0x00 | 握手通信 | 建立连接，测试通信 |
| 0x01 | 发送打印 | 更新打印内容 |
| 0x11 | 启动喷印 | 启动喷码机工作 |
| 0x12 | 停止喷印 | 停止喷码机工作 |
| 0x13 | 触发喷印 | 触发一次打印动作 |
| 0x14 | 获取报警状态 | 查询设备报警信息 |
| 0x1C | 发送信息文件 | 发送二维码/文本等内容 |
| 0x26 | 获取墨盒余量 | 查询墨盒剩余量 |

完整命令列表请查看调试面板或API文档。

### 状态码说明

| 状态码 | 说明 |
|--------|------|
| 0x00 | 成功 - 无错误 |
| 0x01 | 喷码机错误 |
| 0x11 | 二维码子模块数过多 |
| 0x12 | 喷印已启动 |
| 0x13 | 喷印未启动 |
| 0xFF | 喷码机锁定 |

---

## API 接口

完整的API文档请参阅: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### 主要接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/printer/status` | GET | 获取打印机状态（连接、墨盒、温度、打印状态）|
| `/api/printer/print` | POST | 发送打印任务（二维码或文本）|
| `/api/printer/start` | POST | 启动喷印 |
| `/api/printer/stop` | POST | 停止喷印 |
| `/api/printer/connect` | POST | 手动连接喷码机 |
| `/api/printer/disconnect` | POST | 断开喷码机连接 |
| `/api/printer/logs` | GET | 获取通信日志 |
| `/api/printer/debug` | POST | 执行调试命令 |
| `/api/stepper/move` | POST | 控制导轨移动 |
| `/api/settings` | GET/POST | 获取/更新系统配置 |

---

## 故障排除

### 1. GPIO 初始化失败
```bash
# 启动pigpio守护进程
sudo pigpiod

# 检查服务状态
sudo systemctl status pigpiod

# 设置开机自启
sudo systemctl enable pigpiod
```

### 2. TCP连接失败
- ✅ 检查喷码机IP地址是否正确
- ✅ 确认喷码机和树莓派在同一网络
- ✅ 使用 `ping <IP>` 测试网络连通性
- ✅ 检查端口号配置是否正确
- ✅ 确认机号设置与喷码机一致

### 3. 喷码机无响应
- ✅ 检查机号是否正确（通常为IP最后一个字节）
- ✅ 查看通信日志中的状态码
- ✅ 尝试发送握手命令（0x00）测试连接
- ✅ 检查喷码机是否处于锁定状态

### 4. 墨盒余量显示0%
- ✅ 点击刷新按钮手动更新
- ✅ 确认喷码机已正确连接
- ✅ 检查墨盒是否安装正确
- ✅ 查看通信日志确认命令执行成功

### 5. CPU温度显示0°C
- ✅ 确认在树莓派设备上运行（非其他Linux系统）
- ✅ 检查文件权限：`ls -l /sys/class/thermal/thermal_zone0/temp`
- ✅ 手动测试：`cat /sys/class/thermal/thermal_zone0/temp`

### 6. 步进电机不转动
- ✅ 检查GPIO引脚连接是否正确
- ✅ 确认pigpio服务正在运行
- ✅ 检查驱动器电源供电
- ✅ 验证引脚配置（DIR/STEP/ENABLE）

更多问题请查看: [INSTALL.md](./INSTALL.md)

---

## 技术栈

- **前端框架**: Next.js 16 + React 19.2
- **UI组件**: shadcn/ui + Tailwind CSS v4
- **图标**: Lucide Icons
- **网络通信**: Node.js net模块 (TCP)
- **GPIO控制**: pigpio
- **状态管理**: SWR (stale-while-revalidate)
- **类型**: TypeScript

---

## 项目结构

```
printer-control/
├── app/
│   ├── page.tsx                    # 主界面
│   ├── api/
│   │   ├── printer/
│   │   │   ├── status/route.ts     # 状态查询
│   │   │   ├── print/route.ts      # 打印任务
│   │   │   ├── start/route.ts      # 启动喷印
│   │   │   ├── stop/route.ts       # 停止喷印
│   │   │   ├── connect/route.ts    # 连接喷码机
│   │   │   ├── disconnect/route.ts # 断开连接
│   │   │   ├── logs/route.ts       # 通信日志
│   │   │   └── debug/route.ts      # 调试命令
│   │   ├── stepper/
│   │   │   └── move/route.ts       # 导轨控制
│   │   └── settings/route.ts       # 配置管理
│   └── globals.css                 # 全局样式
├── components/
│   ├── debug-panel.tsx             # 调试面板组件
│   ├── content-editor.tsx          # 内容编辑组件
│   └── ui/                         # UI组件库（shadcn）
├── lib/
│   ├── printer.ts                  # 喷码机控制逻辑（TCP通信）
│   ├── stepper.ts                  # 步进电机控制逻辑
│   └── swr.ts                      # SWR配置
├── docs/
│   └── TIJ_通讯协议6.6无屏机.pdf   # 协议文档
├── INSTALL.md                      # 详细安装指南
├── API_DOCUMENTATION.md            # API接口文档
├── README.md                       # 项目说明（本文件）
├── package.json                    # 项目依赖
└── next.config.mjs                 # Next.js配置
```

---

## 开发指南

### 添加新命令

在 `lib/printer.ts` 中添加新的命令函数：

```typescript
export async function myNewCommand(param: number) {
  const data = Buffer.from([param])
  const response = await sendCommand(0xXX, "新命令名称", data)
  return { success: response.success, data: response.data }
}
```

### 创建新API端点

在 `app/api/` 下创建新路由：

```typescript
import { NextResponse } from "next/server"
import { myNewCommand } from "@/lib/printer"

export async function POST(request: Request) {
  const { param } = await request.json()
  const result = await myNewCommand(param)
  return NextResponse.json(result)
}
```

### 添加新UI组件

参考 `components/debug-panel.tsx` 和 `components/content-editor.tsx` 的实现方式。

---

## 注意事项

1. **机号配置** - 机号必须与喷码机设置一致，通常为IP地址最后一个字节
2. **GPIO权限** - GPIO操作需要root权限，确保pigpio服务正在运行
3. **网络配置** - 确保树莓派和喷码机在同一局域网
4. **状态轮询** - 默认每20秒自动查询一次状态，避免频繁查询影响性能
5. **通信日志** - 最多保留最近50条记录，自动清理旧记录

---

## 许可证

MIT License

---

## 相关资源

- **[完整安装指南](./INSTALL.md)** - 详细的安装步骤和故障排除
- **[API接口文档](./API_DOCUMENTATION.md)** - 完整的API接口说明
- **TIJ协议文档** - 喷码机通讯协议完整说明
- **[树莓派GPIO引脚图](https://pinout.xyz/)** - 树莓派引脚参考
- **[pigpio文档](http://abyz.me.uk/rpi/pigpio/)** - GPIO控制库文档
- **[Next.js文档](https://nextjs.org/docs)** - Next.js框架文档
- **[shadcn/ui](https://ui.shadcn.com/)** - UI组件库文档

---

## 贡献

欢迎提交Issue和Pull Request！

---

**需要帮助？** 请查看 [INSTALL.md](./INSTALL.md) 中的故障排除章节或查阅通信日志获取详细错误信息。
