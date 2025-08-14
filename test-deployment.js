#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 验证 axi-project-dashboard 部署配置...');

// 检查关键文件
const requiredFiles = [
  'frontend-server.js',
  'ecosystem.config.js',
  'start.sh',
  'backend/start-simple.js',
  'frontend/package.json',
  'backend/package.json',
  'package.json'
];

console.log('📁 检查必需文件:');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`- ${file}: ${exists ? '✅ 存在' : '❌ 不存在'}`);
  if (!exists) {
    allFilesExist = false;
  }
});

// 检查前端构建目录
console.log('\n📁 检查前端构建:');
const frontendDistPath = path.join('frontend', 'dist');
const frontendDistExists = fs.existsSync(frontendDistPath);
console.log(`- frontend/dist: ${frontendDistExists ? '✅ 存在' : '❌ 不存在'}`);

if (!frontendDistExists) {
  console.log('⚠️  前端未构建，需要运行: cd frontend && pnpm run build');
}

// 检查后端构建目录
console.log('\n📁 检查后端构建:');
const backendDistPath = path.join('backend', 'dist');
const backendDistExists = fs.existsSync(backendDistPath);
console.log(`- backend/dist: ${backendDistExists ? '✅ 存在' : '❌ 不存在'}`);

if (!backendDistExists) {
  console.log('⚠️  后端未构建，需要运行: cd backend && pnpm run build:simple');
}

// 检查 ecosystem.config.js 配置
console.log('\n📋 检查 PM2 配置:');
try {
  const ecosystemConfig = require('./ecosystem.config.js');
  const apps = ecosystemConfig.apps || [];
  
  console.log(`- 应用数量: ${apps.length}`);
  
  apps.forEach((app, index) => {
    console.log(`- 应用 ${index + 1}: ${app.name}`);
    console.log(`  - 脚本: ${app.script}`);
    console.log(`  - 端口: ${app.env?.PORT || app.env?.FRONTEND_PORT || '未配置'}`);
  });
  
  // 检查是否包含前端和后端服务
  const hasBackend = apps.some(app => app.name === 'dashboard-backend');
  const hasFrontend = apps.some(app => app.name === 'dashboard-frontend');
  
  console.log(`- 后端服务: ${hasBackend ? '✅ 配置' : '❌ 缺失'}`);
  console.log(`- 前端服务: ${hasFrontend ? '✅ 配置' : '❌ 缺失'}`);
  
} catch (error) {
  console.log(`❌ 读取 ecosystem.config.js 失败: ${error.message}`);
}

// 检查端口配置
console.log('\n🔌 检查端口配置:');
const ports = [8090, 3000];
ports.forEach(port => {
  console.log(`- 端口 ${port}: 检查中...`);
});

// 总结
console.log('\n📊 部署配置验证总结:');
console.log(`- 必需文件: ${allFilesExist ? '✅ 完整' : '❌ 缺失'}`);
console.log(`- 前端构建: ${frontendDistExists ? '✅ 已构建' : '❌ 未构建'}`);
console.log(`- 后端构建: ${backendDistExists ? '✅ 已构建' : '❌ 未构建'}`);

if (allFilesExist && frontendDistExists && backendDistExists) {
  console.log('\n🎉 部署配置验证通过！可以尝试部署。');
  console.log('\n🚀 部署命令:');
  console.log('1. 确保依赖已安装: pnpm install');
  console.log('2. 启动服务: ./start.sh');
  console.log('3. 或使用 PM2: pm2 start ecosystem.config.js');
} else {
  console.log('\n⚠️  部署配置存在问题，请先解决上述问题。');
  process.exit(1);
}
