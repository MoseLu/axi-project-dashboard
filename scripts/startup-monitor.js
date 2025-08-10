#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting axi-project-dashboard with performance monitoring...');

const startTime = Date.now();

// 启动后端
const backend = spawn('pnpm', ['--filter', 'axi-deploy-dashboard-backend', 'dev:fast'], {
  stdio: 'pipe',
  shell: true
});

backend.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(`[Backend] ${output.trim()}`);
  
  // 检测后端启动完成
  if (output.includes('Server is running on port')) {
    const backendTime = Date.now() - startTime;
    console.log(`⏱️ Backend started in ${backendTime}ms`);
  }
});

backend.stderr.on('data', (data) => {
  console.error(`[Backend Error] ${data.toString().trim()}`);
});

// 启动前端
const frontend = spawn('pnpm', ['--filter', 'axi-deploy-dashboard-frontend', 'start'], {
  stdio: 'pipe',
  shell: true
});

frontend.stdout.on('data', (data) => {
  const output = data.toString();
  console.log(`[Frontend] ${output.trim()}`);
  
  // 检测前端启动完成
  if (output.includes('Local:')) {
    const frontendTime = Date.now() - startTime;
    console.log(`⏱️ Frontend started in ${frontendTime}ms`);
  }
});

frontend.stderr.on('data', (data) => {
  console.error(`[Frontend Error] ${data.toString().trim()}`);
});

// 监控进程退出
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  backend.kill('SIGINT');
  frontend.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down...');
  backend.kill('SIGTERM');
  frontend.kill('SIGTERM');
  process.exit(0);
});

// 错误处理
backend.on('error', (error) => {
  console.error('❌ Backend process error:', error);
});

frontend.on('error', (error) => {
  console.error('❌ Frontend process error:', error);
});

console.log('📊 Performance monitoring enabled');
console.log('💡 Use Ctrl+C to stop all services');
