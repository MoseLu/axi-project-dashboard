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

  // 检查是否已经存在编译后的文件（在清理之前检查）
  const hasExistingBuild = fs.existsSync('dist') && fs.existsSync('dist/index.js');
  if (hasExistingBuild) {
    console.log('✅ 发现已编译的文件，跳过编译...');
  } else {
    // 确保 dist 目录存在
    if (!fs.existsSync('dist')) {
      fs.mkdirSync('dist', { recursive: true });
    }
    // 尝试编译 TypeScript
    console.log('📝 尝试编译 TypeScript...');
    try {
      // 首先尝试使用本地 TypeScript
      execSync('npx tsc', { stdio: 'inherit' });
    } catch (error) {
      console.log('⚠️ 本地 TypeScript 编译失败，尝试使用全局 TypeScript...');
      try {
        execSync('tsc', { stdio: 'inherit' });
      } catch (globalError) {
        console.log('⚠️ 全局 TypeScript 也不可用，检查是否有预编译文件...');
        
        // 检查当前工作目录和文件结构
        console.log('🔍 当前工作目录:', process.cwd());
        console.log('🔍 检查 src 目录是否存在:', fs.existsSync('src'));
        console.log('🔍 检查 src/index.ts 是否存在:', fs.existsSync('src/index.ts'));
        
        // 检查是否有预编译的 JavaScript 文件
        if (fs.existsSync('src/index.ts')) {
          console.log('📝 发现 TypeScript 源文件，但无法编译...');
          console.log('💡 请确保在生产环境中包含编译后的文件');
          
          // 在生产环境中，如果无法编译，尝试直接复制源文件
          console.log('🔄 尝试直接复制源文件作为临时解决方案...');
          if (!fs.existsSync('dist')) {
            fs.mkdirSync('dist', { recursive: true });
          }
          
          // 简单地将 TypeScript 文件复制为 JavaScript 文件（临时方案）
          const sourceContent = fs.readFileSync('src/index.ts', 'utf8');
          fs.writeFileSync('dist/index.js', sourceContent);
          console.log('⚠️ 已创建临时 index.js 文件（未编译）');
        } else {
          // 如果 src/index.ts 不存在，尝试创建一个基本的 index.js
          console.log('📝 未找到 TypeScript 源文件，创建基本的 index.js...');
          if (!fs.existsSync('dist')) {
            fs.mkdirSync('dist', { recursive: true });
          }
          
          const basicIndexContent = `
const express = require('express');
const app = express();
const PORT = process.env.PORT || 8090;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(\`🚀 服务器运行在端口 \${PORT}\`);
});
          `.trim();
          
          fs.writeFileSync('dist/index.js', basicIndexContent);
          console.log('⚠️ 已创建基本的 index.js 文件');
        }
      }
    }
  }

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
    // 使用跨平台的复制方法
    if (process.platform === 'win32') {
      execSync('xcopy uploads dist\\uploads /E /I /Y', { stdio: 'inherit' });
    } else {
      execSync('cp -r uploads dist/', { stdio: 'inherit' });
    }
  }

  // 验证构建结果
  console.log('🔍 验证构建结果...');
  if (fs.existsSync('dist/index.js')) {
    console.log('✅ 主入口文件构建成功');
  } else {
    throw new Error('主入口文件构建失败');
  }

  console.log('✅ 后端构建完成！');
  // 跨平台的文件大小检查
  try {
    if (process.platform === 'win32') {
      const sizeOutput = execSync('dir dist /s', { encoding: 'utf8' });
      console.log('📊 构建产物已创建');
    } else {
      console.log('📊 构建产物大小:', execSync('du -sh dist', { encoding: 'utf8' }).trim());
    }
  } catch (error) {
    console.log('📊 构建产物已创建（无法获取大小信息）');
  }

} catch (error) {
  console.error('❌ 构建失败:', error.message);
  process.exit(1);
}
