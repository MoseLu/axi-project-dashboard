const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// 启用CORS
app.use(cors({
  origin: '*',
  credentials: true
}));

// 创建Socket.IO服务器
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  path: '/project-dashboard/ws/socket.io'
});

// 基本路由
app.get('/', (req, res) => {
  res.json({
    message: 'WebSocket测试服务器正在运行',
    timestamp: new Date().toISOString(),
    socketPath: '/project-dashboard/ws/socket.io'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'WebSocket测试服务器健康检查通过',
    timestamp: new Date().toISOString()
  });
});

// Socket.IO连接处理
io.on('connection', (socket) => {
  console.log('客户端连接成功:', socket.id);
  
  // 发送欢迎消息
  socket.emit('welcome', {
    message: '欢迎连接到WebSocket服务器',
    socketId: socket.id,
    timestamp: new Date().toISOString()
  });
  
  // 处理心跳
  socket.on('heartbeat', () => {
    console.log('收到心跳:', socket.id);
    socket.emit('heartbeat', {
      message: '心跳响应',
      timestamp: new Date().toISOString()
    });
  });
  
  // 处理自定义事件
  socket.on('event', (data) => {
    console.log('收到事件:', data);
    socket.emit('event', {
      type: 'response',
      payload: data,
      timestamp: new Date().toISOString()
    });
  });
  
  // 处理断开连接
  socket.on('disconnect', (reason) => {
    console.log('客户端断开连接:', socket.id, '原因:', reason);
  });
});

// 启动服务器
const PORT = 8081;
server.listen(PORT, () => {
  console.log(`🚀 WebSocket测试服务器启动成功！`);
  console.log(`📡 HTTP服务地址: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket地址: ws://localhost:${PORT}/project-dashboard/ws`);
  console.log(`📊 Socket.IO路径: /project-dashboard/ws/socket.io`);
  console.log(`⏰ 启动时间: ${new Date().toISOString()}`);
  console.log(`💡 按 Ctrl+C 停止服务器`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});
