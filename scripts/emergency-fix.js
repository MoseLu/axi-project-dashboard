#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚨 紧急修复服务器部署问题...');

try {
  const backendDir = path.join(__dirname, '..', 'backend');
  
  if (!fs.existsSync(backendDir)) {
    console.log('❌ Backend 目录不存在');
    process.exit(1);
  }

  console.log('📁 进入 backend 目录...');
  process.chdir(backendDir);

  // 检查当前目录结构
  console.log('📁 检查目录结构...');
  const files = fs.readdirSync('.');
  files.forEach(file => {
    const stat = fs.statSync(file);
    console.log(`  ${stat.isDirectory() ? '📁' : '📄'} ${file}`);
  });

  // 检查 src 目录
  if (!fs.existsSync('src')) {
    console.log('❌ src 目录不存在，这是问题的根源！');
    console.log('🔍 检查是否有其他 TypeScript 文件...');
    
    const tsFiles = files.filter(file => file.endsWith('.ts'));
    if (tsFiles.length > 0) {
      console.log('📄 找到 TypeScript 文件:', tsFiles.join(', '));
      console.log('🔄 创建 src 目录并移动文件...');
      
      // 创建 src 目录
      fs.mkdirSync('src', { recursive: true });
      
      // 移动 TypeScript 文件到 src 目录
      tsFiles.forEach(file => {
        if (file !== 'build.js' && file !== 'start-server.js') {
          const sourcePath = path.join('.', file);
          const targetPath = path.join('src', file);
          fs.copyFileSync(sourcePath, targetPath);
          console.log(`  ✅ 移动 ${file} 到 src/`);
        }
      });
    } else {
      console.log('❌ 没有找到 TypeScript 源文件');
      process.exit(1);
    }
  }

  // 检查 src 目录内容
  if (fs.existsSync('src')) {
    console.log('📁 src 目录内容:');
    const srcFiles = fs.readdirSync('src');
    srcFiles.forEach(file => {
      console.log(`  📄 ${file}`);
    });
  }

  // 强制清理并重新构建
  console.log('🧹 强制清理 dist 目录...');
  if (fs.existsSync('dist')) {
    try {
      fs.rmSync('dist', { recursive: true, force: true });
      console.log('✅ 清理完成');
    } catch (error) {
      console.log('⚠️ 清理失败，尝试使用 rimraf...');
      try {
        execSync('npx rimraf dist', { stdio: 'inherit' });
        console.log('✅ 使用 rimraf 清理完成');
      } catch (rimrafError) {
        console.log('❌ 清理失败:', rimrafError.message);
      }
    }
  }

  // 重新构建
  console.log('🔨 重新构建项目...');
  execSync('npm run build', { stdio: 'inherit' });

  // 验证构建结果
  console.log('🔍 验证构建结果...');
  if (fs.existsSync('dist/index.js')) {
    const content = fs.readFileSync('dist/index.js', 'utf8');
    console.log('📄 dist/index.js 文件大小:', content.length, '字符');
    
    if (content.includes('module-alias/register')) {
      console.log('✅ 包含 module-alias/register');
    } else {
      console.log('❌ 缺少 module-alias/register');
    }
    
    if (content.includes('./config/config')) {
      console.log('✅ 路径别名已转换为相对路径');
    } else {
      console.log('❌ 路径别名转换失败');
    }
    
    // 手动添加 module-alias/register 如果缺失
    if (!content.includes('module-alias/register')) {
      console.log('🔧 手动添加 module-alias/register...');
      const updatedContent = `"use strict";
require("module-alias/register");
${content}`;
      fs.writeFileSync('dist/index.js', updatedContent);
      console.log('✅ 手动添加完成');
    }
  } else {
    console.log('❌ dist/index.js 不存在');
    process.exit(1);
  }

  // 检查 PM2 配置
  console.log('🔍 检查 PM2 配置...');
  const ecosystemPath = path.join(__dirname, '..', 'ecosystem.config.js');
  if (fs.existsSync(ecosystemPath)) {
    const ecosystemContent = fs.readFileSync(ecosystemPath, 'utf8');
    if (ecosystemContent.includes('./backend/dist/index.js')) {
      console.log('✅ PM2 配置正确指向 dist/index.js');
    } else {
      console.log('❌ PM2 配置需要更新');
    }
  }

  console.log('🎉 紧急修复完成！');
  console.log('📋 下一步操作：');
  console.log('1. 重启 PM2 服务: pm2 restart dashboard-backend');
  console.log('2. 检查服务状态: pm2 status');
  console.log('3. 查看日志: pm2 logs dashboard-backend');

} catch (error) {
  console.error('❌ 紧急修复失败:', error.message);
  console.error('📋 错误详情:', error.stack);
  process.exit(1);
}
