#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Server-side dependency fix for axi-project-dashboard...');

// 服务器端缺失的关键依赖
const serverMissingDeps = [
  'statuses',
  'on-finished',
  'ee-first',
  'finalhandler',
  'send',
  'serve-static',
  'range-parser',
  'encodeurl',
  'escape-html',
  'depd',
  'ms',
  'utils-merge',
  'merge-descriptors',
  'mime',
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
  console.log('📦 Installing server dependencies...');
  
  // 进入后端目录
  process.chdir(path.join(__dirname, '..', 'backend'));
  
  // 一次性安装所有服务器端依赖
  const installCommand = `pnpm add ${serverMissingDeps.join(' ')}`;
  console.log(`Executing: ${installCommand}`);
  
  execSync(installCommand, { stdio: 'inherit' });
  
  console.log('✅ Server dependencies installation completed');
  
  // 回到根目录
  process.chdir(path.join(__dirname, '..'));
  
  // 重新安装所有依赖
  console.log('🔄 Reinstalling all dependencies...');
  execSync('pnpm install --force', { stdio: 'inherit' });
  
  // 重新构建项目
  console.log('🔨 Rebuilding project...');
  execSync('pnpm build', { stdio: 'inherit' });
  
  console.log('🎉 Server dependency fix completed successfully!');
  console.log('💡 The server should now start without dependency errors');
  
} catch (error) {
  console.error('❌ Server dependency fix failed:', error.message);
  process.exit(1);
}
