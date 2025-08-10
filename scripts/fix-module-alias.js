#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 修复模块别名问题...');

try {
  const backendDir = path.join(__dirname, '..', 'backend');
  
  if (!fs.existsSync(backendDir)) {
    console.log('❌ Backend 目录不存在');
    process.exit(1);
  }

  console.log('📁 进入 backend 目录...');
  process.chdir(backendDir);

  // 检查是否有 src 目录
  if (!fs.existsSync('src')) {
    console.log('❌ src 目录不存在，无法编译');
    process.exit(1);
  }

  // 清理 dist 目录
  if (fs.existsSync('dist')) {
    try {
      fs.rmSync('dist', { recursive: true, force: true });
      console.log('✅ 清理 dist 目录');
    } catch (error) {
      console.log('⚠️ 清理 dist 目录失败，继续...');
    }
  }

  // 重新构建项目
  console.log('🔨 重新构建项目...');
  execSync('npm run build', { stdio: 'inherit' });

  // 验证构建结果
  if (fs.existsSync('dist/index.js')) {
    const content = fs.readFileSync('dist/index.js', 'utf8');
    if (content.includes('module-alias/register') && content.includes('./config/config')) {
      console.log('✅ 模块别名修复成功');
      console.log('✅ 构建文件验证通过');
    } else {
      console.log('❌ 构建文件验证失败');
      process.exit(1);
    }
  } else {
    console.log('❌ 构建文件不存在');
    process.exit(1);
  }

  console.log('🎉 模块别名问题修复完成！');
} catch (error) {
  console.error('❌ 修复失败:', error.message);
  process.exit(1);
}
