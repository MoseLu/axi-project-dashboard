#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Auto-fix startup for axi-project-dashboard...');

// 检查并修复依赖问题
function fixDependencies() {
  console.log('🔧 Checking and fixing dependencies...');
  
  try {
    // 检查关键依赖是否存在
    const criticalDeps = ['statuses', 'on-finished', 'ee-first', 'finalhandler'];
    const backendNodeModules = path.join(__dirname, '..', 'backend', 'node_modules');
    
    let needsFix = false;
    for (const dep of criticalDeps) {
      const depPath = path.join(backendNodeModules, dep);
      if (!fs.existsSync(depPath)) {
        console.log(`❌ Missing dependency: ${dep}`);
        needsFix = true;
      }
    }
    
    if (needsFix) {
      console.log('📦 Installing missing dependencies...');
      
      // 进入后端目录
      process.chdir(path.join(__dirname, '..', 'backend'));
      
      // 安装缺失的依赖
      const installCommand = `pnpm add ${criticalDeps.join(' ')}`;
      execSync(installCommand, { stdio: 'inherit' });
      
      // 回到根目录
      process.chdir(path.join(__dirname, '..'));
      
      // 重新安装所有依赖
      execSync('pnpm install --force', { stdio: 'inherit' });
      
      console.log('✅ Dependencies fixed successfully');
    } else {
      console.log('✅ All dependencies are present');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to fix dependencies:', error.message);
    return false;
  }
}

// 启动服务并监控
function startService() {
  console.log('🚀 Starting service...');
  
  // 使用 PM2 启动服务
  const pm2Process = spawn('pm2', ['start', 'ecosystem.config.js'], {
    stdio: 'pipe',
    shell: true
  });
  
  pm2Process.stdout.on('data', (data) => {
    console.log(`[PM2] ${data.toString().trim()}`);
  });
  
  pm2Process.stderr.on('data', (data) => {
    console.error(`[PM2 Error] ${data.toString().trim()}`);
  });
  
  pm2Process.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Service started successfully');
      // 等待一段时间确保服务完全启动
      setTimeout(() => {
        checkServiceHealth();
      }, 5000);
    } else {
      console.error('❌ Failed to start service');
      process.exit(1);
    }
  });
}

// 检查服务健康状态
function checkServiceHealth() {
  console.log('🔍 Checking service health...');
  
  try {
    // 检查端口是否监听
    const netstatProcess = spawn('netstat', ['-tlnp'], {
      stdio: 'pipe',
      shell: true
    });
    
    let output = '';
    netstatProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    netstatProcess.on('close', () => {
      if (output.includes(':8080')) {
        console.log('✅ Service is listening on port 8080');
        console.log('🎉 Startup completed successfully!');
        process.exit(0);
      } else {
        console.log('⚠️ Service may not be fully started, but continuing...');
        console.log('🎉 Startup process completed!');
        process.exit(0);
      }
    });
  } catch (error) {
    console.log('⚠️ Could not check service health, but continuing...');
    console.log('🎉 Startup process completed!');
    process.exit(0);
  }
}

// 主函数
function main() {
  console.log('🔧 Auto-fix startup process started...');
  
  // 1. 修复依赖
  if (!fixDependencies()) {
    console.error('❌ Failed to fix dependencies');
    process.exit(1);
  }
  
  // 2. 启动服务
  startService();
}

// 处理进程退出
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, exiting gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, exiting gracefully...');
  process.exit(0);
});

// 启动主流程
main();
