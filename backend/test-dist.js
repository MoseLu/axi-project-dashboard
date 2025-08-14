#!/usr/bin/env node

const path = require('path');

// 设置环境变量
process.env.NODE_ENV = 'production';
process.env.PORT = '8090';
process.env.WEBSOCKET_PORT = '8091';

console.log('🧪 Testing dist service...');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT);
console.log('- WEBSOCKET_PORT:', process.env.WEBSOCKET_PORT);

// 切换到 dist 目录
process.chdir(path.join(__dirname, 'dist'));

console.log('- Current directory:', process.cwd());
console.log('- Files in dist:', require('fs').readdirSync('.'));

try {
  // 尝试加载配置
  console.log('📋 Loading config...');
  const config = require('./config/config').config;
  console.log('- Config loaded successfully');
  console.log('- Port:', config.port);
  console.log('- Environment:', config.env);
  
  // 尝试启动服务
  console.log('🚀 Starting service...');
  require('./index.js');
  
  console.log('✅ Service started successfully');
} catch (error) {
  console.error('❌ Service failed to start:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}
