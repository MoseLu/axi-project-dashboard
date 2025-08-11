const express = require('express');
const app = express();
const port = process.env.PORT || 8090;

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'axi-project-dashboard API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// 根端点
app.get('/', (req, res) => {
  res.json({
    message: 'axi-project-dashboard API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
app.listen(port, () => {
  console.log(`🚀 axi-project-dashboard server is running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
