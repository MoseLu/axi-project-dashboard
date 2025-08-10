const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Building backend...');

try {
  // 强制重新构建，确保使用最新的修复
  console.log('🔄 Force rebuilding to ensure latest fixes are applied...');

  // 清理 dist 目录
  if (fs.existsSync('dist')) {
    try {
      fs.rmSync('dist', { recursive: true, force: true });
      console.log('✅ Cleaned dist directory');
    } catch (error) {
      // 如果 fs.rmSync 不可用，使用 rimraf
      try {
        execSync('npx rimraf dist', { stdio: 'inherit' });
        console.log('✅ Cleaned dist directory using rimraf');
      } catch (rimrafError) {
        console.log('⚠️ Failed to clean dist directory, continuing...');
      }
    }
  }

  // 检查是否有 src 目录
  if (!fs.existsSync('src')) {
    console.log('❌ No src directory found!');
    console.log('📁 Current directory contents:');
    try {
      const files = fs.readdirSync('.');
      files.forEach(file => {
        const stat = fs.statSync(file);
        console.log(`  ${stat.isDirectory() ? '📁' : '📄'} ${file}`);
      });
    } catch (error) {
      console.log('⚠️ Could not list directory contents:', error.message);
    }
    console.log('❌ Cannot build without src directory');
    process.exit(1);
  }

  console.log('📁 Found src directory, checking contents...');
  try {
    const srcFiles = fs.readdirSync('src');
    console.log('📄 Source files:', srcFiles.join(', '));
  } catch (error) {
    console.log('⚠️ Could not list src directory contents:', error.message);
  }

  // 编译 TypeScript
  execSync('npx tsc', { stdio: 'inherit' });
  console.log('✅ TypeScript compilation completed');

  // 处理路径别名
  try {
    execSync('npx tsc-alias', { stdio: 'inherit' });
    console.log('✅ Path aliases processed');
  } catch (error) {
    console.log('⚠️ Failed to process path aliases, continuing...');
  }

  // 添加 module-alias 注册到 index.js
  if (fs.existsSync('dist/index.js')) {
    const indexContent = fs.readFileSync('dist/index.js', 'utf8');
    if (!indexContent.includes('module-alias/register')) {
      const updatedContent = `"use strict";
require("module-alias/register");
${indexContent}`;
      fs.writeFileSync('dist/index.js', updatedContent);
      console.log('✅ Added module-alias registration to index.js');
    }
  }

  // 复制必要的文件
  if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    fs.writeFileSync('dist/package.json', JSON.stringify(packageJson, null, 2));
    console.log('✅ Copied package.json with updated module aliases');
  }

  console.log('🎉 Backend build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
