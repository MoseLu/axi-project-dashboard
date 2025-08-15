#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 开始构建后端服务...');

try {
  // 清理 dist 目录
  if (fs.existsSync('dist')) {
    console.log('🧹 清理 dist 目录...');
    fs.rmSync('dist', { recursive: true, force: true });
  }

  // 编译 TypeScript
  console.log('📝 编译 TypeScript...');
  execSync('npx tsc', { stdio: 'inherit' });

  // 复制必要的文件到 dist 目录
  console.log('📋 复制配置文件...');
  
  // 复制 package.json
  if (fs.existsSync('package.json')) {
    fs.copyFileSync('package.json', 'dist/package.json');
  }

  // 复制 tsconfig.json
  if (fs.existsSync('tsconfig.json')) {
    fs.copyFileSync('tsconfig.json', 'dist/tsconfig.json');
  }

  // 复制上传目录
  if (fs.existsSync('uploads')) {
    console.log('📁 复制上传目录...');
    execSync('cp -r uploads dist/', { stdio: 'inherit' });
  }

  // 验证构建结果
  console.log('🔍 验证构建结果...');
  if (fs.existsSync('dist/index.js')) {
    console.log('✅ 主入口文件构建成功');
  } else {
    throw new Error('主入口文件构建失败');
  }

  console.log('✅ 后端构建完成！');
  console.log('📊 构建产物大小:', execSync('du -sh dist', { encoding: 'utf8' }).trim());

} catch (error) {
  console.error('❌ 构建失败:', error.message);
  process.exit(1);
}
