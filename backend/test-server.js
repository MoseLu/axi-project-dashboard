#!/usr/bin/env node

const express = require('express');
const app = express();

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'Test server is running',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 8081
  });
});

// 启动服务器
const port = process.env.PORT || 8081;
app.listen(port, () => {
  console.log(`🚀 Test server is running on port ${port}`);
  console.log(`💚 Health Check: http://localhost:${port}/health`);
});

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
