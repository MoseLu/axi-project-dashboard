#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Quick Start for axi-project-dashboard...');

const startTime = Date.now();

// 检查依赖是否完整
function checkDependencies() {
  const backendNodeModules = path.join(__dirname, '..', 'backend', 'node_modules');
  const criticalDeps = ['express', 'on-finished', 'ee-first'];
  
  for (const dep of criticalDeps) {
    const depPath = path.join(backendNodeModules, dep);
    if (!fs.existsSync(depPath)) {
      console.log(`❌ Missing critical dependency: ${dep}`);
      return false;
    }
  }
  
  console.log('✅ All critical dependencies found');
  return true;
}

// 启动后端
function startBackend() {
  console.log('🔧 Starting backend...');
  
  const backend = spawn('pnpm', ['--filter', 'axi-deploy-dashboard-backend', 'dev:fast'], {
    stdio: 'pipe',
    shell: true,
    cwd: path.join(__dirname, '..')
  });

  backend.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`[Backend] ${output.trim()}`);
    
    if (output.includes('Server is running on port')) {
      const backendTime = Date.now() - startTime;
      console.log(`⏱️ Backend started in ${backendTime}ms`);
    }
  });

  backend.stderr.on('data', (data) => {
    const error = data.toString();
    console.error(`[Backend Error] ${error.trim()}`);
    
    // 如果遇到依赖错误，自动修复
    if (error.includes('Cannot find module') || error.includes('MODULE_NOT_FOUND')) {
      console.log('🔧 Detected dependency issue, attempting to fix...');
      fixDependencies();
    }
  });

  return backend;
}

// 启动前端
function startFrontend() {
  console.log('🎨 Starting frontend...');
  
  const frontend = spawn('pnpm', ['--filter', 'axi-deploy-dashboard-frontend', 'start'], {
    stdio: 'pipe',
    shell: true,
    cwd: path.join(__dirname, '..')
  });

  frontend.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`[Frontend] ${output.trim()}`);
    
    if (output.includes('Local:')) {
      const frontendTime = Date.now() - startTime;
      console.log(`⏱️ Frontend started in ${frontendTime}ms`);
    }
  });

  frontend.stderr.on('data', (data) => {
    console.error(`[Frontend Error] ${data.toString().trim()}`);
  });

  return frontend;
}

// 修复依赖
function fixDependencies() {
  console.log('🔧 Running dependency fix...');
  
  const fixProcess = spawn('node', ['scripts/fix-dependencies.js'], {
    stdio: 'inherit',
    shell: true,
    cwd: path.join(__dirname, '..')
  });

  fixProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Dependencies fixed, restarting...');
      // 重新启动
      setTimeout(() => {
        startBackend();
        startFrontend();
      }, 2000);
    } else {
      console.error('❌ Failed to fix dependencies');
    }
  });
}

// 主启动流程
function main() {
  console.log('🔍 Checking dependencies...');
  
  if (!checkDependencies()) {
    console.log('🔧 Dependencies incomplete, fixing...');
    fixDependencies();
    return;
  }
  
  console.log('🚀 Starting services...');
  const backend = startBackend();
  const frontend = startFrontend();
  
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
  
  console.log('📊 Quick start monitoring enabled');
  console.log('💡 Use Ctrl+C to stop all services');
}

// 启动主流程
main();
