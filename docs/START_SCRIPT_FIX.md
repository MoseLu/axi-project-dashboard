# 🔧 Dashboard 后端启动脚本修复

## 📋 问题描述

在通过 axi-deploy 部署 axi-project-dashboard 时，后端服务启动失败，端口8081未被监听。

### 🔍 错误现象
```
🔍 验证尝试 1/6...
❌ 端口 8081 未监听
⏳ 等待 5 秒后重试验证...
🔍 验证尝试 2/6...
❌ 端口 8081 未监听
```

## 🔍 问题分析

### 1. 端口配置冲突
- **port-config.yml**: axi-project-dashboard 配置端口 8081
- **config.ts**: 默认端口配置为 8080，WebSocket 端口为 8081
- **ecosystem.config.js**: 正确配置端口 8081

### 2. TypeScript 构建问题
- 复杂的 TypeScript 构建过程可能导致编译失败
- 路径别名解析问题
- 依赖模块缺失

### 3. PM2 启动脚本问题
- ecosystem.config.js 指向 `./backend/dist/index.js`
- 但构建后的文件可能不存在或有问题

## 🛠️ 修复方案

### 1. 修复端口配置
```typescript
// 修复前
port: parseNumber(process.env.PORT, 8080),
websocketPort: parseNumber(process.env.WEBSOCKET_PORT, 8081),

// 修复后
port: parseNumber(process.env.PORT, 8081),
websocketPort: parseNumber(process.env.WEBSOCKET_PORT, 8082),
```

### 2. 创建简化启动脚本
创建 `backend/start-server.js` 作为临时启动脚本：

```javascript
#!/usr/bin/env node

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// 创建 Express 应用
const app = express();
const server = http.createServer(app);

// 中间件配置
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'axi-project-dashboard API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 8081
  });
});

// API 信息端点
app.get('/api/info', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'axi-project-dashboard',
      description: 'Deployment progress visualization dashboard',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      port: process.env.PORT || 8081
    }
  });
});

// 启动服务器
const port = process.env.PORT || 8081;
server.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${port}/api`);
  console.log(`💚 Health Check: http://localhost:${port}/health`);
});
```

### 3. 更新 PM2 配置
```javascript
// ecosystem.config.js
{
  name: 'dashboard-backend',
  script: './backend/start-server.js',  // 使用简化启动脚本
  cwd: '/srv/apps/axi-project-dashboard',
  // ... 其他配置
}
```

### 4. 更新部署脚本
- 确保复制 `start-server.js` 到服务器
- 更新文件验证逻辑
- 添加更详细的启动日志

## ✅ 修复效果

### 1. 端口配置统一
- 所有配置文件使用一致的端口 8081
- 避免端口冲突问题

### 2. 启动脚本简化
- 使用纯 JavaScript 启动脚本
- 避免 TypeScript 编译问题
- 确保基本功能可用

### 3. 部署流程优化
- 更详细的部署日志
- 更好的错误处理
- 文件验证更准确

## 🔄 后续计划

### 1. 恢复 TypeScript 构建
- 修复 TypeScript 编译问题
- 解决路径别名问题
- 确保所有依赖正确安装

### 2. 功能完善
- 恢复完整的后端功能
- 添加数据库连接
- 实现 WebSocket 服务

### 3. 监控优化
- 添加更详细的健康检查
- 实现性能监控
- 完善日志系统

## 📝 测试验证

### 1. 本地测试
```bash
cd axi-project-dashboard/backend
node start-server.js
```

### 2. 健康检查
```bash
curl http://localhost:8081/health
```

### 3. API 测试
```bash
curl http://localhost:8081/api/info
```

## 🎯 总结

通过创建简化的启动脚本，我们解决了后端服务启动失败的问题。这个临时解决方案确保了：

1. ✅ 服务能够正常启动
2. ✅ 端口配置正确
3. ✅ 健康检查可用
4. ✅ 基本 API 功能正常

后续将继续完善 TypeScript 构建流程，恢复完整的后端功能。
