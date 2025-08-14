#!/usr/bin/env node

const express = require('express');
const http = require('http');
const cors = require('cors');

// 创建 Express 应用
const app = express();
const server = http.createServer(app);

// 获取端口配置
const PORT = process.env.PORT || 8090;

console.log('🚀 快速启动 axi-project-dashboard 后端服务...');
console.log(`🔌 端口: ${PORT}`);

// 基本中间件
app.use(cors());
app.use(express.json());

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'axi-project-dashboard API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: PORT
  });
});

// 根路径
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'AXI Project Dashboard API',
    version: '1.0.0',
    port: PORT
  });
});

// 启动服务器
server.listen(PORT, () => {
  console.log(`✅ 服务启动成功！端口: ${PORT}`);
  console.log(`🔗 健康检查: http://localhost:${PORT}/health`);
  console.log(`🌐 根路径: http://localhost:${PORT}/`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('🛑 收到 SIGTERM，正在关闭服务...');
  server.close(() => {
    console.log('✅ 服务已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 收到 SIGINT，正在关闭服务...');
  server.close(() => {
    console.log('✅ 服务已关闭');
    process.exit(0);
  });
});
