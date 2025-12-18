# 树莓派喷码机控制系统 - 安装指南

## 一、系统要求

### 硬件要求
- 树莓派 3/4/5 (推荐树莓派4以上)
- TIJ喷码机 (带RS232接口)
- USB转RS232转换器
- 42步进电机 + 驱动器 (A4988/DRV8825)
- 5V电源适配器

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
# 安装编译工具链 (serialport需要)
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
# 安装依赖 (会自动重新编译 serialport)
npm install

# 如果遇到 serialport 编译错误，手动重新编译
npm rebuild serialport --build-from-source
```

### 3. 配置串口权限
```bash
# 将当前用户添加到 dialout 组
sudo usermod -a -G dialout $USER

# 为串口设备添加权限
sudo chmod 666 /dev/ttyUSB0

# 重新登录使权限生效 (或重启)
sudo reboot
```

---

## 四、硬件连接

### 1. 喷码机连接
- 使用 USB转RS232 转换器连接喷码机
- 插入树莓派USB口后，设备通常为 `/dev/ttyUSB0`
- 确认设备存在: `ls -l /dev/ttyUSB*`

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

### 1. 检查串口
```bash
# 列出串口设备
ls -l /dev/ttyUSB*

# 测试串口通信
sudo apt-get install minicom
minicom -D /dev/ttyUSB0 -b 115200
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

## 七、故障排除

### 问题1: serialport 编译失败

**错误信息:**
```
No native build was found for platform=linux arch=arm64
```

**解决方案:**
```bash
# 安装编译依赖
sudo apt-get install -y build-essential python3

# 手动重新编译
cd ~/printer-control
npm rebuild serialport --build-from-source

# 或者删除 node_modules 重新安装
rm -rf node_modules package-lock.json
npm install
```

---

### 问题2: 串口权限拒绝

**错误信息:**
```
Error: Opening /dev/ttyUSB0: Permission denied
```

**解决方案:**
```bash
# 方法1: 添加用户到 dialout 组
sudo usermod -a -G dialout $USER
# 重新登录或重启

# 方法2: 直接修改串口权限
sudo chmod 666 /dev/ttyUSB0

# 方法3: 创建 udev 规则 (永久生效)
echo 'KERNEL=="ttyUSB[0-9]*", MODE="0666"' | sudo tee /etc/udev/rules.d/50-usb-serial.rules
sudo udevadm control --reload-rules
```

---

### 问题3: GPIO 初始化失败

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

### 问题4: 喷码机无响应

**可能原因:**
1. 串口路径错误
2. 波特率不匹配
3. 喷码机未开机
4. 线缆连接问题

**排查步骤:**
```bash
# 1. 确认串口设备
ls -l /dev/ttyUSB*

# 2. 使用 minicom 测试
sudo minicom -D /dev/ttyUSB0 -b 115200

# 3. 检查线缆针脚
# TX → RX
# RX → TX
# GND → GND

# 4. 在Web界面尝试不同波特率
# 常见: 9600, 19200, 38400, 57600, 115200
```

---

### 问题5: 步进电机不转

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

### 问题6: CPU温度显示为0

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

## 八、性能优化

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
static ip_address=192.168.1.100/24
static routers=192.168.1.1
static domain_name_servers=8.8.8.8

# 重启网络
sudo systemctl restart dhcpcd
```

---

## 九、安全建议

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

## 十、备份与恢复

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

## 十一、技术支持

### 文档资源
- TIJ通讯协议: `TIJ_通讯协议6.6无屏机.pdf`
- 树莓派GPIO: https://pinout.xyz/
- pigpio文档: http://abyz.me.uk/rpi/pigpio/
- serialport文档: https://serialport.io/

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
ping 192.168.1.1
ifconfig
```

---

安装完成后，访问 `http://<树莓派IP>:3000` 开始使用系统！
