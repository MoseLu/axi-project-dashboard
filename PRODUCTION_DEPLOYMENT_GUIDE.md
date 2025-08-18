# axi-project-dashboard 生产环境部署指南

## 概述

本指南详细说明如何在生产环境中部署axi-project-dashboard，并解决WebSocket 502错误问题。

## 问题诊断

### 502错误原因分析

502 Bad Gateway错误通常由以下原因引起：

1. **nginx upstream配置错误**：使用Docker容器名称而非IP地址
2. **后端服务未运行**：PM2进程未启动或端口被占用
3. **网络连接问题**：防火墙或网络配置阻止连接
4. **权限问题**：nginx无法访问后端服务端口

### 验证步骤

```bash
# 1. 检查API端点（应该返回200）
curl -v "https://redamancy.com.cn/project-dashboard/api/status"

# 2. 检查WebSocket端点（之前返回502）
curl -v "https://redamancy.com.cn/project-dashboard/ws/socket.io/?EIO=4&transport=polling"

# 3. 检查健康检查端点
curl -v "https://redamancy.com.cn/project-dashboard/health"
```

## 解决方案

### 1. 修复nginx配置

**问题**：nginx配置中使用了Docker容器名称，但生产环境无法解析

**修复前**：
```nginx
upstream backend {
    server backend:8090;  # ❌ Docker容器名称
}

upstream websocket {
    server backend:8090;  # ❌ Docker容器名称
}
```

**修复后**：
```nginx
upstream backend {
    server 127.0.0.1:8090;  # ✅ 本地IP地址
}

upstream websocket {
    server 127.0.0.1:8090;  # ✅ 本地IP地址
}
```

**自动修复**：
```bash
node fix-production-nginx.js
```

### 2. 确保服务正常运行

```bash
# 检查PM2状态
pm2 status

# 检查端口占用
netstat -an | grep :8090
netstat -an | grep :3000

# 重启服务（如果需要）
pm2 stop all
pm2 delete all
pm2 start ecosystem.config.js
```

### 3. 重新加载nginx配置

```bash
# 方法1：重新加载配置
nginx -s reload

# 方法2：重启nginx服务
systemctl restart nginx

# 方法3：检查nginx配置语法
nginx -t
```

### 4. 验证修复结果

```bash
# 测试WebSocket连接
curl -v "https://redamancy.com.cn/project-dashboard/ws/socket.io/?EIO=4&transport=polling"

# 应该返回类似以下响应：
# HTTP/1.1 200 OK
# Content-Type: application/octet-stream
# ...
```

## 部署步骤

### 1. 环境准备

```bash
# 安装Node.js和PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pm2

# 安装nginx
sudo apt-get install -y nginx
```

### 2. 项目部署

```bash
# 克隆项目
git clone https://github.com/MoseLu/axi-project-dashboard.git
cd axi-project-dashboard

# 安装依赖
npm install

# 构建前端
cd frontend
npm run build
cd ..

# 启动服务
pm2 start ecosystem.config.js
```

### 3. nginx配置

```bash
# 复制nginx配置
sudo cp config/nginx.conf /etc/nginx/nginx.conf

# 修复生产环境配置
node fix-production-nginx.js

# 重新加载nginx
sudo nginx -s reload
```

### 4. 防火墙配置

```bash
# 开放必要端口
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 8090
sudo ufw allow 3000
```

## 监控和维护

### 1. 服务监控

```bash
# PM2监控
pm2 monit

# 查看日志
pm2 logs

# 查看状态
pm2 status
```

### 2. nginx监控

```bash
# 查看nginx状态
sudo systemctl status nginx

# 查看错误日志
sudo tail -f /var/log/nginx/error.log

# 查看访问日志
sudo tail -f /var/log/nginx/access.log
```

### 3. 健康检查

```bash
# 创建健康检查脚本
cat > health-check.sh << 'EOF'
#!/bin/bash
echo "检查后端服务..."
curl -f http://localhost:8090/health || echo "后端服务异常"

echo "检查前端服务..."
curl -f http://localhost:3000/health || echo "前端服务异常"

echo "检查WebSocket连接..."
curl -f "http://localhost:8090/ws/socket.io/?EIO=4&transport=polling" || echo "WebSocket连接异常"
EOF

chmod +x health-check.sh
```

## 故障排除

### 常见问题

1. **502 Bad Gateway**
   - 检查nginx upstream配置
   - 确认后端服务正在运行
   - 检查端口是否被占用

2. **WebSocket连接失败**
   - 验证nginx WebSocket代理配置
   - 检查CORS设置
   - 确认Socket.IO路径配置

3. **服务启动失败**
   - 检查PM2日志
   - 确认端口未被占用
   - 验证环境变量配置

### 调试工具

项目提供了以下调试工具：

1. **fix-production-nginx.js**：自动修复nginx配置
2. **test-websocket-local.js**：测试WebSocket连接
3. **fix-deployment-502.js**：诊断502错误
4. **health-check.sh**：健康检查脚本

### 日志分析

```bash
# PM2日志
pm2 logs --lines 100

# nginx错误日志
sudo tail -f /var/log/nginx/error.log

# 系统日志
sudo journalctl -u nginx -f
```

## 性能优化

### 1. nginx优化

```nginx
# 启用gzip压缩
gzip on;
gzip_types text/plain text/css application/json application/javascript;

# 启用缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 2. PM2优化

```javascript
// ecosystem.config.js
{
  instances: "max",  // 使用所有CPU核心
  exec_mode: "cluster",  // 集群模式
  max_memory_restart: "1G",  // 内存限制
}
```

### 3. 监控告警

```bash
# 设置监控告警
pm2 install pm2-server-monit
pm2 set pm2-server-monit:threshold 80
```

## 安全配置

### 1. SSL/TLS配置

```nginx
server {
    listen 443 ssl http2;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # 安全头部
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
}
```

### 2. 防火墙配置

```bash
# 只开放必要端口
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 3. 环境变量安全

```bash
# 使用环境变量存储敏感信息
export JWT_SECRET="your-secure-jwt-secret"
export GITHUB_TOKEN="your-github-token"
```

## 备份和恢复

### 1. 配置备份

```bash
# 备份nginx配置
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# 备份PM2配置
pm2 save
cp ~/.pm2/dump.pm2 ~/.pm2/dump.pm2.backup
```

### 2. 数据备份

```bash
# 备份数据库
mysqldump -u root -p project_dashboard > backup.sql

# 备份项目文件
tar -czf axi-project-dashboard-backup.tar.gz /srv/apps/axi-project-dashboard
```

## 联系支持

如果遇到问题，请：

1. 收集完整的错误日志
2. 运行诊断工具
3. 检查系统资源使用情况
4. 联系技术支持团队

---

**最后更新**：2025-08-18  
**版本**：1.0.0  
**维护者**：axi-project团队
