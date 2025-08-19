#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

console.log('🔧 axi-project-dashboard 502错误修复工具');
console.log('=====================================\n');

// 检查服务状态
const checkServiceStatus = async () => {
  console.log('🔍 检查服务状态...');
  
  try {
    const { stdout } = await execAsync('pm2 status --no-daemon');
    console.log('📊 PM2 服务状态:');
    console.log(stdout);
    
    // 检查端口占用
    const { stdout: netstatOutput } = await execAsync('netstat -an | findstr :8090');
    console.log('🔌 端口8090占用情况:');
    console.log(netstatOutput || '端口8090未被占用');
    
    const { stdout: netstatOutput2 } = await execAsync('netstat -an | findstr :3000');
    console.log('🔌 端口3000占用情况:');
    console.log(netstatOutput2 || '端口3000未被占用');
    
  } catch (error) {
    console.error('❌ 检查服务状态失败:', error.message);
  }
};

// 检查nginx配置
const checkNginxConfig = () => {
  console.log('\n🔍 检查nginx配置...');
  
  const nginxConfigPath = path.join(__dirname, 'config', 'nginx.conf');
  const nginxLocalConfigPath = path.join(__dirname, 'config', 'nginx-local.conf');
  
  if (fs.existsSync(nginxConfigPath)) {
    console.log('✅ nginx配置文件存在:', nginxConfigPath);
    
    const config = fs.readFileSync(nginxConfigPath, 'utf8');
    
    // 检查upstream配置
    if (config.includes('server backend:8090')) {
      console.log('⚠️  发现Docker容器配置: backend:8090');
      console.log('💡 建议使用本地配置: localhost:8090');
    }
    
    if (config.includes('server localhost:8090')) {
      console.log('✅ 发现本地配置: localhost:8090');
    }
    
  } else {
    console.log('❌ nginx配置文件不存在:', nginxConfigPath);
  }
  
  if (fs.existsSync(nginxLocalConfigPath)) {
    console.log('✅ 本地nginx配置文件存在:', nginxLocalConfigPath);
  }
};

// 检查环境配置
const checkEnvironmentConfig = () => {
  console.log('\n🔍 检查环境配置...');
  
  const envConfigPath = path.join(__dirname, 'frontend', 'src', 'config', 'env.ts');
  
  if (fs.existsSync(envConfigPath)) {
    console.log('✅ 前端环境配置文件存在:', envConfigPath);
    
    const config = fs.readFileSync(envConfigPath, 'utf8');
    
    // 检查WebSocket URL配置
    if (config.includes('redamancy.com.cn')) {
      console.log('🌐 生产环境配置: redamancy.com.cn');
    }
    
    if (config.includes('localhost')) {
      console.log('🏠 本地环境配置: localhost');
    }
    
  } else {
    console.log('❌ 前端环境配置文件不存在:', envConfigPath);
  }
};

// 重启服务
const restartServices = async () => {
  console.log('\n🔄 重启服务...');
  
  try {
    console.log('⏹️  停止所有服务...');
    await execAsync('pm2 stop all');
    
    console.log('🗑️  删除所有服务...');
    await execAsync('pm2 delete all');
    
    console.log('🚀 重新启动服务...');
    await execAsync('pm2 start ecosystem.config.js');
    
    console.log('✅ 服务重启完成');
    
    // 等待服务启动
    console.log('⏳ 等待服务启动...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 检查服务状态
    const { stdout } = await execAsync('pm2 status --no-daemon');
    console.log('📊 重启后服务状态:');
    console.log(stdout);
    
  } catch (error) {
    console.error('❌ 重启服务失败:', error.message);
  }
};

// 测试连接
const testConnections = async () => {
  console.log('\n🧪 测试连接...');
  
  const http = require('http');
  
  // 测试后端健康检查
  const testBackendHealth = () => {
    return new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: 8090,
        path: '/health',
        method: 'GET',
        timeout: 5000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log('✅ 后端健康检查:', res.statusCode);
          console.log('📄 响应内容:', data);
          resolve(res.statusCode === 200);
        });
      });
      
      req.on('error', (err) => {
        console.error('❌ 后端健康检查失败:', err.message);
        resolve(false);
      });
      
      req.on('timeout', () => {
        console.error('⏰ 后端健康检查超时');
        req.destroy();
        resolve(false);
      });
      
      req.end();
    });
  };
  
  // 测试前端健康检查
  const testFrontendHealth = () => {
    return new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/health',
        method: 'GET',
        timeout: 5000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          console.log('✅ 前端健康检查:', res.statusCode);
          console.log('📄 响应内容:', data);
          resolve(res.statusCode === 200);
        });
      });
      
      req.on('error', (err) => {
        console.error('❌ 前端健康检查失败:', err.message);
        resolve(false);
      });
      
      req.on('timeout', () => {
        console.error('⏰ 前端健康检查超时');
        req.destroy();
        resolve(false);
      });
      
      req.end();
    });
  };
  
  const backendOk = await testBackendHealth();
  const frontendOk = await testFrontendHealth();
  
  if (backendOk && frontendOk) {
    console.log('🎉 所有服务连接正常!');
  } else {
    console.log('⚠️  部分服务连接异常');
  }
};

// 生成修复建议
const generateFixSuggestions = () => {
  console.log('\n💡 502错误修复建议:');
  console.log('=====================================');
  console.log('1. 🔧 确保后端服务正在运行:');
  console.log('   - 检查PM2状态: pm2 status');
  console.log('   - 重启服务: pm2 restart all');
  console.log('');
  console.log('2. 🌐 检查nginx配置:');
  console.log('   - 确保upstream指向正确的地址');
  console.log('   - 本地环境使用: localhost:8090');
  console.log('   - 生产环境使用: backend:8090 (Docker)');
  console.log('');
  console.log('3. 🔌 检查端口占用:');
  console.log('   - 确保端口8090和3000未被其他进程占用');
  console.log('   - 使用: netstat -an | findstr :8090');
  console.log('');
  console.log('4. 📝 检查环境变量:');
  console.log('   - 确保CORS_ORIGIN配置正确');
  console.log('   - 检查WebSocket路径配置');
  console.log('');
  console.log('5. 🐳 如果是Docker环境:');
  console.log('   - 确保容器正在运行: docker ps');
  console.log('   - 检查容器网络: docker network ls');
  console.log('   - 重启容器: docker-compose restart');
  console.log('');
  console.log('6. 🔍 查看详细日志:');
  console.log('   - PM2日志: pm2 logs');
  console.log('   - nginx日志: tail -f /var/log/nginx/error.log');
  console.log('');
};

// 主函数
const main = async () => {
  try {
    await checkServiceStatus();
    checkNginxConfig();
    checkEnvironmentConfig();
    await restartServices();
    await testConnections();
    generateFixSuggestions();
    
    console.log('\n✅ 诊断完成!');
    console.log('📋 请根据上述建议进行修复');
    
  } catch (error) {
    console.error('❌ 诊断过程中出现错误:', error.message);
  }
};

main();
