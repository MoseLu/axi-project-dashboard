const io = require('socket.io-client');

console.log('🔍 测试WebSocket连接...');

const socket = io('http://localhost:8081', {
  path: '/project-dashboard/ws/socket.io',
  transports: ['polling', 'websocket'],
  timeout: 5000
});

socket.on('connect', () => {
  console.log('✅ WebSocket连接成功！');
  console.log('📊 Socket ID:', socket.id);
  console.log('🔗 连接状态:', socket.connected);
});

socket.on('connect_error', (error) => {
  console.log('❌ WebSocket连接失败:', error.message);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 WebSocket断开连接:', reason);
});

// 5秒后断开连接
setTimeout(() => {
  console.log('🔄 测试完成，断开连接...');
  socket.disconnect();
  process.exit(0);
}, 5000);
