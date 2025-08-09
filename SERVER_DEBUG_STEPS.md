# 🔍 服务器502错误排查步骤

## 1. 连接服务器并切换到项目目录

```bash
# SSH连接到服务器
ssh your-user@your-server

# 切换到项目目录
cd /srv/apps/axi-project-dashboard
pwd  # 确认当前目录
```

## 2. 检查项目文件结构

```bash
# 检查项目目录结构
echo "=== 项目目录结构 ==="
ls -la

# 检查后端目录
echo "=== 后端目录 ==="
ls -la backend/

# 检查关键文件是否存在
echo "=== 检查关键文件 ==="
ls -la backend/start-server.js
ls -la backend/index.js
ls -la ecosystem.config.js
ls -la package.json
```

## 3. 检查Node.js和PM2环境

```bash
# 检查Node.js版本
echo "=== Node.js环境 ==="
node --version
npm --version
which node

# 检查PM2
echo "=== PM2环境 ==="
pm2 --version
which pm2

# 如果PM2不存在，安装PM2
# npm install -g pm2
```

## 4. 检查start-server.js文件内容

```bash
# 查看start-server.js的内容
echo "=== start-server.js 内容 ==="
cat backend/start-server.js

# 检查文件权限
ls -la backend/start-server.js

# 如果权限不对，设置执行权限
chmod +x backend/start-server.js
```

## 5. 检查PM2进程状态

```bash
# 查看所有PM2进程
echo "=== PM2进程列表 ==="
pm2 list

# 查看dashboard-backend进程详情
echo "=== dashboard-backend进程详情 ==="
pm2 describe dashboard-backend

# 查看PM2日志
echo "=== PM2日志 ==="
pm2 logs dashboard-backend --lines 50
```

## 6. 手动测试Node.js应用启动

```bash
# 停止PM2进程（如果存在）
pm2 stop dashboard-backend
pm2 delete dashboard-backend

# 手动启动start-server.js测试
echo "=== 手动测试启动 ==="
cd /srv/apps/axi-project-dashboard
node backend/start-server.js

# 如果出错，查看错误信息
# 如果成功，应该看到类似输出：
# 🚀 Server is running on port 8090
# ✅ Database connected successfully (或警告信息)
```

## 7. 测试端口8090

```bash
# 在另一个终端窗口中测试端口
# 新开一个SSH会话，然后执行：

# 检查端口是否被占用
echo "=== 端口占用检查 ==="
netstat -tlnp | grep 8090
ss -tlnp | grep 8090

# 测试本地连接
echo "=== 本地健康检查 ==="
curl -v http://localhost:8090/health
curl -v http://127.0.0.1:8090/health

# 测试基本连接
telnet localhost 8090
```

## 8. 检查依赖模块

```bash
# 检查node_modules是否存在
echo "=== 检查依赖 ==="
ls -la node_modules/ | head -10

# 检查关键依赖
ls node_modules/express || echo "express缺失"
ls node_modules/module-alias || echo "module-alias缺失"

# 如果缺失，重新安装
# npm install --production
```

## 9. 检查数据库和Redis连接

```bash
# 测试MySQL连接
echo "=== 测试MySQL连接 ==="
mysql -h 127.0.0.1 -P 3306 -u root -p123456 -e "SHOW DATABASES;"

# 测试Redis连接
echo "=== 测试Redis连接 ==="
redis-cli ping

# 如果连接失败，检查服务状态
systemctl status mysql
systemctl status redis
```

## 10. 使用PM2重新启动

```bash
# 重新使用PM2启动
echo "=== PM2重新启动 ==="
pm2 start ecosystem.config.js --update-env

# 等待几秒钟
sleep 5

# 检查状态
pm2 status
pm2 describe dashboard-backend

# 查看最新日志
pm2 logs dashboard-backend --lines 20
```

## 11. 检查防火墙和网络

```bash
# 检查防火墙状态
echo "=== 防火墙检查 ==="
systemctl status firewalld || systemctl status ufw

# 检查端口是否对外开放
iptables -L | grep 8090 || echo "未找到8090端口规则"

# 从外部测试端口（如果防火墙允许）
# curl -v http://your-server-ip:8090/health
```

## 12. 检查Nginx配置

```bash
# 检查Nginx配置
echo "=== Nginx配置检查 ==="
nginx -t

# 查看项目相关的Nginx配置
cat /etc/nginx/conf.d/*project-dashboard* || echo "配置文件不存在"

# 重新加载Nginx配置
nginx -s reload

# 检查Nginx错误日志
tail -50 /var/log/nginx/error.log
```

## 13. 最终测试

```bash
# 完整的端到端测试
echo "=== 端到端测试 ==="

# 1. 确保服务运行
pm2 status | grep dashboard-backend

# 2. 本地测试
curl -s http://localhost:8090/health | jq . || curl -s http://localhost:8090/health

# 3. 通过Nginx测试
curl -s http://localhost/project-dashboard/api/health | jq . || curl -s http://localhost/project-dashboard/api/health
```

## 常见问题和解决方案

### 问题1: start-server.js执行错误
```bash
# 解决方案：检查module-alias是否安装
npm list module-alias
# 如果缺失：npm install module-alias
```

### 问题2: 数据库连接失败
```bash
# 解决方案：修改连接参数或启动服务
systemctl start mysql
# 或修改环境变量
```

### 问题3: PM2启动失败
```bash
# 解决方案：检查ecosystem.config.js配置
cat ecosystem.config.js
# 确保路径正确
```

### 问题4: 端口被占用
```bash
# 查找占用进程
lsof -i :8090
# 杀死进程
kill -9 <PID>
```

## 📋 排查结果收集

请将以下信息收集并反馈：

1. **文件检查结果**：start-server.js是否存在及内容
2. **PM2状态**：pm2 list和pm2 logs的输出
3. **端口检查**：netstat的输出
4. **手动启动结果**：node backend/start-server.js的输出
5. **错误日志**：PM2和Nginx的错误日志

这些信息将帮助我们准确定位502错误的根本原因。
