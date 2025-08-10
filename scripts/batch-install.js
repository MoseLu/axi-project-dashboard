#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Batch installing missing dependencies...');

// 所有缺失的依赖
const missingDeps = [
  'mime-types',
  'mime-db',
  'negotiator',
  'accepts',
  'type-is',
  'content-type',
  'content-disposition',
  'etag',
  'fresh',
  'proxy-addr',
  'forwarded',
  'ipaddr.js',
  'qs',
  'cookie',
  'cookie-signature',
  'vary',
  'methods',
  'path-to-regexp',
  'array-flatten',
  'setprototypeof',
  'http-errors',
  'inherits',
  'object-inspect',
  'string_decoder',
  'safe-buffer'
];

try {
  // 进入后端目录
  process.chdir(path.join(__dirname, '..', 'backend'));
  
  console.log('📦 Installing all missing dependencies at once...');
  
  // 一次性安装所有依赖
  const installCommand = `pnpm add ${missingDeps.join(' ')}`;
  console.log(`Executing: ${installCommand}`);
  
  execSync(installCommand, { stdio: 'inherit' });
  
  console.log('✅ Batch installation completed');
  
  // 回到根目录
  process.chdir(path.join(__dirname, '..'));
  
  // 重新安装所有依赖
  console.log('🔄 Reinstalling all dependencies...');
  execSync('pnpm install --force', { stdio: 'inherit' });
  
  // 重新构建项目
  console.log('🔨 Rebuilding project...');
  execSync('pnpm build', { stdio: 'inherit' });
  
  console.log('🎉 All dependencies installed successfully!');
  console.log('💡 You can now run: pnpm dev:fast');
  
} catch (error) {
  console.error('❌ Batch installation failed:', error.message);
  process.exit(1);
}
