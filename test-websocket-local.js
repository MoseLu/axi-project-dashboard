#!/usr/bin/env node

const { io } = require('socket.io-client');

console.log('🧪 测试本地WebSocket连接...');

// 测试本地连接
const testLocalConnection = () => {
  console.log('📍 测试本地连接: ws://localhost:8090/ws');
  
  const socket = io('ws://localhost:8090', {
    path: '/ws/socket.io',
    transports: ['websocket', 'polling'],
    timeout: 10000,
    forceNew: true
  });

  socket.on('connect', () => {
    console.log('✅ 本地WebSocket连接成功!');
    console.log('🔗 Socket ID:', socket.id);
    console.log('📊 连接状态:', socket.connected);
    
    // 发送测试消息
    socket.emit('test', { message: 'Hello from test script', timestamp: new Date().toISOString() });
    
    // 5秒后断开连接
    setTimeout(() => {
      console.log('🔄 测试完成，断开连接...');
      socket.disconnect();
      process.exit(0);
    }, 5000);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ 本地WebSocket连接失败:', error.message);
    console.error('🔍 错误详情:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 连接断开:', reason);
  });

  socket.on('error', (error) => {
    console.error('❌ Socket错误:', error);
  });

  // 设置连接超时
  setTimeout(() => {
    if (!socket.connected) {
      console.error('⏰ 连接超时');
      socket.disconnect();
      process.exit(1);
    }
  }, 15000);
};

// 测试通过nginx代理的连接
const testNginxProxyConnection = () => {
  console.log('\n📍 测试nginx代理连接: ws://localhost:8090/project-dashboard/ws');
  
  const socket = io('ws://localhost:8090', {
    path: '/project-dashboard/ws/socket.io',
    transports: ['websocket', 'polling'],
    timeout: 10000,
    forceNew: true
  });

  socket.on('connect', () => {
    console.log('✅ nginx代理WebSocket连接成功!');
    console.log('🔗 Socket ID:', socket.id);
    console.log('📊 连接状态:', socket.connected);
    
    // 发送测试消息
    socket.emit('test', { message: 'Hello from nginx test', timestamp: new Date().toISOString() });
    
    // 5秒后断开连接
    setTimeout(() => {
      console.log('🔄 测试完成，断开连接...');
      socket.disconnect();
      process.exit(0);
    }, 5000);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ nginx代理WebSocket连接失败:', error.message);
    console.error('🔍 错误详情:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 连接断开:', reason);
  });

  socket.on('error', (error) => {
    console.error('❌ Socket错误:', error);
  });

  // 设置连接超时
  setTimeout(() => {
    if (!socket.connected) {
      console.error('⏰ 连接超时');
      socket.disconnect();
      process.exit(1);
    }
  }, 15000);
};

// 检查服务是否运行
const checkServices = () => {
  console.log('🔍 检查服务状态...');
  
  const http = require('http');
  
  // 检查后端服务
  const checkBackend = () => {
    return new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: 8090,
        path: '/health',
        method: 'GET',
        timeout: 5000
      }, (res) => {
        console.log('✅ 后端服务状态:', res.statusCode);
        resolve(res.statusCode === 200);
      });
      
      req.on('error', (err) => {
        console.error('❌ 后端服务检查失败:', err.message);
        resolve(false);
      });
      
      req.on('timeout', () => {
        console.error('⏰ 后端服务检查超时');
        req.destroy();
        resolve(false);
      });
      
      req.end();
    });
  };
  
  checkBackend().then((backendOk) => {
    if (backendOk) {
      console.log('🚀 开始WebSocket连接测试...\n');
      testLocalConnection();
    } else {
      console.error('❌ 后端服务未运行，请先启动服务');
      process.exit(1);
    }
  });
};

// 主函数
const main = () => {
  console.log('🧪 axi-project-dashboard WebSocket 连接测试');
  console.log('=====================================\n');
  
  checkServices();
};

main();
