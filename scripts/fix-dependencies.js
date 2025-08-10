#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing dependencies for axi-project-dashboard...');

// 定义所有可能缺失的Express相关依赖
const missingDependencies = [
  // 核心依赖
  'on-finished',
  'ee-first',
  'finalhandler',
  'statuses',
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
  'safe-buffer',
  // 额外的Express相关依赖
  'body-parser',
  'compression',
  'cors',
  'helmet',
  'express-rate-limit',
  'express-validator',
  'swagger-jsdoc',
  'swagger-ui-express',
  'socket.io',
  'redis',
  'mysql2',
  'bcryptjs',
  'jsonwebtoken',
  'uuid',
  'winston',
  'dayjs',
  'lodash',
  'axios',
  'node-cron',
  'dotenv',
  'module-alias',
  'joi',
  'debug'
];

try {
  console.log('📦 Installing missing dependencies...');
  
  // 进入后端目录
  process.chdir(path.join(__dirname, '..', 'backend'));
  
  // 安装所有可能缺失的依赖
  for (const dep of missingDependencies) {
    try {
      console.log(`Installing ${dep}...`);
      execSync(`pnpm add ${dep}`, { stdio: 'inherit' });
    } catch (error) {
      console.log(`⚠️ ${dep} already exists or failed to install`);
    }
  }
  
  console.log('✅ Dependencies installation completed');
  
  // 回到根目录
  process.chdir(path.join(__dirname, '..'));
  
  // 重新安装所有依赖
  console.log('🔄 Reinstalling all dependencies...');
  execSync('pnpm install --force', { stdio: 'inherit' });
  
  // 重新构建项目
  console.log('🔨 Rebuilding project...');
  execSync('pnpm build', { stdio: 'inherit' });
  
  console.log('🎉 Dependency fix completed successfully!');
  console.log('💡 You can now run: pnpm dev:fast');
  
} catch (error) {
  console.error('❌ Dependency fix failed:', error.message);
  process.exit(1);
}
