# 🔌 Dashboard 端口规划

## 📋 端口分配策略

为了避免与其他项目的端口冲突，Dashboard 使用专用的端口范围：

### 🎯 Dashboard 专用端口

| 服务 | 端口 | 说明 | 状态 |
|------|------|------|------|
| **API 服务** | `8090` | Dashboard 后端 API | ✅ 已分配 |
| **WebSocket** | `8091` | 实时通信服务 | ✅ 已分配 |

### 🚫 避免冲突的端口

| 端口 | 项目 | 服务类型 | 冲突风险 |
|------|------|----------|----------|
| `8080` | axi-star-cloud | 后端 API | ❌ 已被占用 |
| `3000` | 通用 | 前端开发服务器 | ⚠️ 开发环境冲突 |
| `5000` | 通用 | Flask/其他后端 | ⚠️ 可能冲突 |
| `8000` | 通用 | Django/其他后端 | ⚠️ 可能冲突 |

## 🏗️ 端口规划原则

### **1. 端口范围分配**
- **8090-8099**: Dashboard 专用端口段
- **8080-8089**: 业务项目端口段 (如 axi-star-cloud)
- **9000+**: 其他系统服务端口段

### **2. 端口命名规则**
```
Dashboard API: 8090 (80 + 90 = Dashboard 的"仪表板"含义)
Dashboard WS:  8091 (8090 + 1)
```

### **3. 端口检查命令**
```bash
# 检查端口占用情况
ssh deploy@redamancy.com.cn "netstat -tlnp | grep -E ':(8080|8090|8091)'"

# 检查 Dashboard 端口是否可用
ssh deploy@redamancy.com.cn "
  for port in 8090 8091; do
    if netstat -tlnp | grep -q :\$port; then
      echo '❌ 端口 '\$port' 已被占用:'
      netstat -tlnp | grep :\$port
    else
      echo '✅ 端口 '\$port' 可用'
    fi
  done
"
```

## 🔧 配置文件中的端口

### **1. ecosystem.config.js**
```javascript
env: {
  PORT: 8090,          // Dashboard API 端口
  WEBSOCKET_PORT: 8091, // Dashboard WebSocket 端口
}
```

### **2. Nginx 配置**
```nginx
# API 代理
location /project-dashboard/api/ {
  proxy_pass http://127.0.0.1:8090;
}

# WebSocket 代理
location /project-dashboard/ws/ {
  proxy_pass http://127.0.0.1:8091;
}
```

### **3. 前端配置**
```bash
# 通过 Nginx 代理，前端无需关心具体端口
REACT_APP_API_URL=https://redamancy.com.cn/project-dashboard/api
REACT_APP_WS_URL=wss://redamancy.com.cn/project-dashboard/ws
```

## 🛡️ 端口安全配置

### **1. 防火墙规则**
```bash
# 只允许本地访问 Dashboard 端口
sudo ufw deny 8090
sudo ufw deny 8091

# 只通过 Nginx 代理对外访问
sudo ufw allow 80
sudo ufw allow 443
```

### **2. Nginx 配置限制**
```nginx
# 禁止直接访问 Dashboard 端口
server {
    listen 8090;
    listen 8091;
    server_name _;
    return 444;  # 直接关闭连接
}
```

## 📊 端口监控

### **1. 健康检查**
```bash
# Dashboard 端口健康检查
curl -f http://localhost:8090/health || echo "❌ API 服务异常"
curl -f http://localhost:8091/health || echo "❌ WebSocket 服务异常"
```

### **2. 端口监控脚本**
```bash
#!/bin/bash
# dashboard-port-monitor.sh

PORTS=(8090 8091)
PROJECT="project-dashboard"

echo "🔍 检查 Dashboard 端口状态..."

for port in "${PORTS[@]}"; do
  if netstat -tlnp | grep -q ":$port "; then
    process=$(netstat -tlnp | grep ":$port " | awk '{print $7}')
    echo "✅ 端口 $port: $process"
  else
    echo "❌ 端口 $port: 未监听"
  fi
done

# 检查 PM2 进程
echo -e "\n📋 PM2 进程状态:"
pm2 status dashboard-backend
```

## 🔄 端口变更流程

如果需要更改 Dashboard 端口：

### **1. 更新配置文件**
```bash
# 1. 修改 ecosystem.config.js
sed -i 's/PORT: 8090/PORT: NEW_PORT/g' ecosystem.config.js

# 2. 修改 deploy.yml 中的 Nginx 配置
sed -i 's/127.0.0.1:8090/127.0.0.1:NEW_PORT/g' .github/workflows/deploy.yml

# 3. 更新文档
sed -i 's/8090/NEW_PORT/g' docs/*.md
```

### **2. 重新部署**
```bash
# 使用独立部署脚本
./scripts/deploy-dashboard.sh --token $TOKEN --force
```

### **3. 验证端口变更**
```bash
# 检查新端口
ssh deploy@redamancy.com.cn "netstat -tlnp | grep :NEW_PORT"

# 测试健康检查
curl https://redamancy.com.cn/project-dashboard/api/health
```

## 🎯 最佳实践

### **DO ✅**
1. 使用专用端口段 (8090-8099) 避免冲突
2. 通过 Nginx 代理对外提供服务
3. 配置防火墙限制直接端口访问
4. 定期监控端口状态和占用情况

### **DON'T ❌**
1. 不要使用常见的冲突端口 (8080, 3000, 5000)
2. 不要直接对外暴露后端端口
3. 不要忘记更新所有相关配置文件
4. 不要在生产环境使用随机端口

通过这种端口规划，确保 Dashboard 与其他项目完全隔离，避免任何端口冲突问题。
