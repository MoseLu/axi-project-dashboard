#!/usr/bin/env node

const { spawn } = require('child_process');
const http = require('http');

console.log('🧪 测试服务启动...');

// 启动服务
const serverProcess = spawn('node', ['start-server.js'], {
  stdio: 'pipe',
  env: { ...process.env, PORT: '8090' }
});

let serverStarted = false;
let testCompleted = false;

// 监听服务输出
serverProcess.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('📤 服务输出:', output.trim());
  
  if (output.includes('Server is running on port 8090')) {
    serverStarted = true;
    console.log('✅ 服务启动成功，开始测试...');
    setTimeout(testHealthEndpoint, 2000);
  }
});

serverProcess.stderr.on('data', (data) => {
  console.log('❌ 服务错误:', data.toString().trim());
});

// 测试健康检查端点
function testHealthEndpoint() {
  console.log('🔍 测试健康检查端点...');
  
  const options = {
    hostname: 'localhost',
    port: 8090,
    path: '/health',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log('📊 健康检查响应:');
      console.log('  状态码:', res.statusCode);
      console.log('  响应体:', data);
      
      if (res.statusCode === 200) {
        console.log('✅ 健康检查通过！');
      } else {
        console.log('❌ 健康检查失败');
      }
      
      testCompleted = true;
      cleanup();
    });
  });

  req.on('error', (error) => {
    console.log('❌ 健康检查请求失败:', error.message);
    testCompleted = true;
    cleanup();
  });

  req.on('timeout', () => {
    console.log('⏰ 健康检查请求超时');
    req.destroy();
    testCompleted = true;
    cleanup();
  });

  req.end();
}

// 清理函数
function cleanup() {
  if (serverProcess && !serverProcess.killed) {
    console.log('🛑 停止测试服务...');
    serverProcess.kill('SIGTERM');
    
    setTimeout(() => {
      if (!serverProcess.killed) {
        console.log('🛑 强制停止服务...');
        serverProcess.kill('SIGKILL');
      }
      process.exit(testCompleted ? 0 : 1);
    }, 3000);
  }
}

// 超时处理
setTimeout(() => {
  if (!testCompleted) {
    console.log('⏰ 测试超时');
    cleanup();
  }
}, 30000);

// 处理进程信号
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
