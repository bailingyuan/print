# 树莓派喷码机控制系统 - 安装指南

## 一、系统要求

### 硬件要求
- 树莓派 3/4/5 (推荐树莓派4以上)
- TIJ喷码机 (支持TCP/IP网络接口)
- 42步进电机 + 驱动器 (A4988/DRV8825)
- 5V电源适配器
- 网线或Wi-Fi连接

### 软件要求
- Raspberry Pi OS (Debian 11+)
- Node.js 18.x 或更高版本

---

## 二、系统准备

### 1. 更新系统
```bash
sudo apt-get update
sudo apt-get upgrade -y
```

### 2. 安装 Node.js
```bash
# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node -v  # 应显示 v18.x.x 或更高
npm -v
```

### 3. 安装系统依赖
```bash
# 安装编译工具链
sudo apt-get install -y build-essential python3

# 安装 pigpio 库 (GPIO控制)
sudo apt-get install -y pigpio python3-pigpio

# 启动 pigpio 守护进程
sudo pigpiod

# 设置开机自启动
sudo systemctl enable pigpiod
sudo systemctl start pigpiod
```

---

## 三、项目安装

### 1. 下载项目
```bash
cd ~
git clone <repository-url> printer-control
cd printer-control
```

### 2. 安装项目依赖
```bash
# 安装依赖
npm install
```

---

## 四、硬件连接

### 1. 喷码机网络连接
- 使用网线连接喷码机到路由器/交换机
- 确保喷码机和树莓派在同一网络
- 记录喷码机的IP地址 (例如: 192.168.1.100)
- 默认端口通常为 9100

**测试连接:**
```bash
# 使用 ping 测试网络连通性
ping 192.168.1.100

# 使用 telnet 测试端口
telnet 192.168.1.100 9100
```

### 2. 步进电机连接

#### GPIO引脚定义
```
树莓派 Pin → 步进电机驱动器
Pin 2  (5V)     → VCC (电源)
Pin 6  (GND)    → GND (地)
Pin 36 (GPIO16) → EN  (使能)
Pin 38 (GPIO20) → DIR (方向)
Pin 40 (GPIO21) → STEP (步进)
```

#### 接线图
```
树莓派 GPIO 引脚布局:
         ┌─────────┐
    3.3V │ 1     2 │ 5V ────────→ 驱动器 VCC
   GPIO2 │ 3     4 │ 5V
   GPIO3 │ 5     6 │ GND ───────→ 驱动器 GND
   GPIO4 │ 7     8 │ GPIO14
     GND │ 9    10 │ GPIO15
         │   ...   │
 GPIO16  │35    36 │ GPIO12 ────→ 驱动器 EN
 GPIO20  │37    38 │ GND ───────→ 驱动器 DIR  
     GND │39    40 │ GPIO21 ────→ 驱动器 STEP
         └─────────┘

注意: GPIO20和GPIO21需要连接到驱动器，GND需要共地
```

#### 步进电机驱动器设置
- 微步设置: 建议1/8或1/16微步
- 电流限制: 根据电机规格调整电位器
- 确保EN低电平使能 (或根据驱动器调整)

---

## 五、启动应用

### 1. 开发模式
```bash
# 启动开发服务器
npm run dev

# 访问地址
# http://localhost:3000
# 或 http://<树莓派IP>:3000
```

### 2. 生产模式
```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm run start
```

### 3. 后台运行 (使用 PM2)
```bash
# 安装 PM2
sudo npm install -g pm2

# 启动应用
pm2 start npm --name "printer-control" -- start

# 设置开机自启动
pm2 startup
pm2 save

# 查看日志
pm2 logs printer-control

# 停止应用
pm2 stop printer-control
```

---

## 六、验证安装

### 1. 检查网络
```bash
# 测试喷码机连通性
ping 192.168.1.100

# 测试端口
telnet 192.168.1.100 9100

# 查看树莓派IP
hostname -I
```

### 2. 检查GPIO
```bash
# 检查 pigpio 服务状态
sudo systemctl status pigpiod

# 测试GPIO (使用pigs命令)
pigs w 21 1  # 设置GPIO21为高电平
pigs w 21 0  # 设置GPIO21为低电平
```

### 3. 检查Web服务
```bash
# 获取树莓派IP地址
hostname -I

# 在浏览器中访问
# http://<树莓派IP>:3000
```

---

## 七、配置喷码机连接

### 1. 打开设置面板
1. 在浏览器访问控制面板
2. 点击右上角设置图标 ⚙️
3. 进入系统设置

### 2. 配置TCP连接
- **IP地址**: 输入喷码机的IP地址 (例如: 192.168.1.100)
- **端口**: 输入喷码机的端口 (通常为 9100)
- 点击"保存设置"

### 3. 配置GPIO引脚
- **方向引脚(DIR)**: GPIO 20
- **步进引脚(STEP)**: GPIO 21
- **使能引脚(ENABLE)**: GPIO 16
- 点击"保存设置"

---

## 八、故障排除

### 问题1: 无法连接喷码机

**错误信息:**
```
TCP connection not available
```

**解决方案:**
```bash
# 1. 检查网络连通性
ping 192.168.1.100

# 2. 检查端口是否开放
telnet 192.168.1.100 9100

# 3. 检查防火墙设置
sudo ufw status

# 4. 确认喷码机IP地址
# 查看喷码机屏幕或配置界面

# 5. 尝试使用网络扫描工具
sudo apt-get install nmap
nmap -p 9100 192.168.1.0/24
```

---

### 问题2: GPIO 初始化失败

**错误信息:**
```
Can't connect to pigpio at localhost(8888)
```

**解决方案:**
```bash
# 检查 pigpio 服务状态
sudo systemctl status pigpiod

# 启动 pigpio
sudo pigpiod

# 如果端口冲突，指定其他端口
sudo pigpiod -p 8889

# 检查防火墙
sudo ufw status
```

---

### 问题3: 喷码机无响应

**可能原因:**
1. IP地址错误
2. 端口号不正确
3. 网络连接问题
4. 喷码机未开机

**排查步骤:**
```bash
# 1. 确认网络连通
ping 192.168.1.100

# 2. 测试端口连接
telnet 192.168.1.100 9100

# 3. 检查路由
traceroute 192.168.1.100

# 4. 在Web界面检查通信日志
# 查看发送和接收的命令
```

---

### 问题4: 步进电机不转

**可能原因:**
1. GPIO引脚连接错误
2. 驱动器未使能
3. 电源不足
4. 驱动器设置问题

**排查步骤:**
```bash
# 1. 测试GPIO输出
pigs w 21 1  # GPIO21 高电平
pigs r 21    # 读取GPIO21状态

# 2. 检查5V电源电压
# 使用万用表测量Pin2和Pin6之间电压

# 3. 检查驱动器使能信号
# EN引脚应为低电平(0V)使能

# 4. 手动测试步进脉冲
pigs hp 21 500 1  # GPIO21输出500us高脉冲
```

---

### 问题5: CPU温度显示为0

**解决方案:**
```bash
# 检查温度文件是否存在
cat /sys/class/thermal/thermal_zone0/temp

# 应输出类似: 45678 (表示45.678°C)

# 如果文件不存在，可能是系统版本问题
# 尝试其他路径
cat /sys/class/hwmon/hwmon0/temp1_input
```

---

### 问题6: 网页无法访问

**解决方案:**
```bash
# 1. 检查Node进程是否运行
ps aux | grep node

# 2. 检查端口占用
sudo netstat -tlnp | grep 3000

# 3. 检查防火墙
sudo ufw allow 3000

# 4. 查看应用日志
pm2 logs printer-control

# 5. 重启应用
pm2 restart printer-control
```

---

## 九、性能优化

### 1. 禁用不必要的服务
```bash
# 禁用蓝牙 (如不需要)
sudo systemctl disable bluetooth

# 禁用Wi-Fi (如使用有线网络)
sudo systemctl disable wpa_supplicant
```

### 2. 优化内存
```bash
# 编辑 /boot/config.txt
sudo nano /boot/config.txt

# 减少GPU内存 (添加或修改)
gpu_mem=16

# 重启生效
sudo reboot
```

### 3. 设置固定IP
```bash
# 编辑 dhcpcd.conf
sudo nano /etc/dhcpcd.conf

# 添加以下内容
interface eth0
static ip_address=192.168.1.99/24
static routers=192.168.1.1
static domain_name_servers=8.8.8.8

# 重启网络
sudo systemctl restart dhcpcd
```

---

## 十、安全建议

### 1. 修改默认密码
```bash
passwd
```

### 2. 配置防火墙
```bash
# 安装 ufw
sudo apt-get install ufw

# 允许SSH
sudo ufw allow 22

# 允许Web访问
sudo ufw allow 3000

# 启用防火墙
sudo ufw enable
```

### 3. 定期更新
```bash
# 创建更新脚本
cat > ~/update.sh << 'EOF'
#!/bin/bash
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get autoremove -y
EOF

chmod +x ~/update.sh

# 设置定期更新 (可选)
# sudo crontab -e
# 0 3 * * 0 /home/pi/update.sh
```

---

## 十一、备份与恢复

### 1. 备份配置
```bash
# 备份项目配置
cp -r ~/printer-control ~/printer-control-backup

# 备份数据库 (如使用)
# ...
```

### 2. SD卡镜像备份
```bash
# 在另一台Linux系统上执行
sudo dd if=/dev/sdX of=~/raspberry-backup.img bs=4M status=progress

# 压缩镜像
gzip ~/raspberry-backup.img
```

---

## 十二、技术支持

### 文档资源
- TIJ通讯协议: `TIJ_通讯协议6.6无屏机.pdf`
- 树莓派GPIO: https://pinout.xyz/
- pigpio文档: http://abyz.me.uk/rpi/pigpio/
- Node.js net模块: https://nodejs.org/api/net.html

### 常用命令速查
```bash
# 查看系统信息
uname -a
cat /etc/os-release

# 查看GPIO状态
gpio readall

# 查看进程
ps aux | grep node

# 查看日志
journalctl -u pigpiod
pm2 logs

# 测试网络
ping 192.168.1.100
ifconfig
netstat -tlnp

# 测试TCP连接
telnet 192.168.1.100 9100
nc -zv 192.168.1.100 9100
```

---

## 十三、网络配置指南

### 1. 查找喷码机IP地址
```bash
# 扫描本地网络
sudo apt-get install nmap
nmap -sn 192.168.1.0/24

# 查找开放9100端口的设备
nmap -p 9100 192.168.1.0/24
```

### 2. 配置静态IP (喷码机)
建议为喷码机配置静态IP地址，避免IP变化导致连接失败。
请参考喷码机说明书进行配置。

### 3. 路由器端口映射 (可选)
如需远程访问，可在路由器配置端口映射:
- 外部端口: 8080 → 内部端口: 3000 (树莓派)

---

安装完成后，访问 `http://<树莓派IP>:3000` 开始使用系统！

**重要提示:** 
- 确保喷码机和树莓派在同一网络
- 首次使用前在设置面板配置正确的TCP连接参数
- 查看通信日志确认命令发送和接收情况
