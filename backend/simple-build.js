#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔨 执行简化构建...');

try {
  // 创建 dist 目录
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
    console.log('✅ 创建 dist 目录');
  }

  // 复制 package.json 到 dist
  if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // 修改启动脚本
    packageJson.scripts.start = 'node start-server.js';
    packageJson.main = 'start-server.js';
    
    fs.writeFileSync('dist/package.json', JSON.stringify(packageJson, null, 2));
    console.log('✅ 复制并修改 package.json');
  }

  // 复制 start-server.js 到 dist
  if (fs.existsSync('start-server.js')) {
    fs.copyFileSync('start-server.js', 'dist/start-server.js');
    console.log('✅ 复制 start-server.js');
  }

  // 创建 uploads 目录
  const uploadsDir = path.join('dist', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ 创建 uploads 目录');
  }

  // 创建 public 目录
  const publicDir = path.join('dist', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
    console.log('✅ 创建 public 目录');
  }

  console.log('🎉 简化构建完成！');
  console.log('📁 构建结果:');
  console.log('  - dist/start-server.js (启动脚本)');
  console.log('  - dist/package.json (包配置)');
  console.log('  - dist/uploads/ (上传目录)');
  console.log('  - dist/public/ (静态文件目录)');

} catch (error) {
  console.error('❌ 构建失败:', error.message);
  process.exit(1);
}
