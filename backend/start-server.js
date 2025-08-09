#!/usr/bin/env node

/**
 * axi-project-dashboard 后端服务启动文件
 * 这个文件用于PM2启动编译后的应用
 */

// 设置模块路径别名，确保能正确解析 @/* 路径
require('module-alias/register');

// 设置环境变量
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// 设置时区
if (process.env.TZ) {
  process.env.TZ = process.env.TZ;
}

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// 启动应用
console.log('🚀 Starting axi-project-dashboard backend...');
console.log(`📊 Environment: ${process.env.NODE_ENV}`);
console.log(`🕐 Starting at: ${new Date().toISOString()}`);

try {
  // 加载编译后的应用
  require('./dist/index.js');
} catch (error) {
  console.error('❌ Failed to start application:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}
