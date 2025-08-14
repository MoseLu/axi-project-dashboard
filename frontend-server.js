#!/usr/bin/env node

const express = require('express');
const path = require('path');
const compression = require('compression');

const app = express();
const PORT = process.env.FRONTEND_PORT || 3000;

console.log('🚀 启动前端静态文件服务器...');
console.log(`🔌 端口: ${PORT}`);

// 启用压缩
app.use(compression());

// 静态文件服务
app.use(express.static(path.join(__dirname, 'frontend/dist'), {
  maxAge: '1y',
  etag: true,
  lastModified: true
}));

// 处理 SPA 路由
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/dist/index.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`✅ 前端服务器启动成功！端口: ${PORT}`);
  console.log(`🌐 访问地址: http://localhost:${PORT}`);
  console.log(`📁 静态文件目录: ${path.join(__dirname, 'frontend/dist')}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('🛑 收到 SIGTERM，正在关闭前端服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 收到 SIGINT，正在关闭前端服务器...');
  process.exit(0);
});
