#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking dependencies for axi-project-dashboard...');

// 定义关键依赖列表
const criticalDependencies = [
  // Express 核心依赖
  'express',
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
  // 项目特定依赖
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

function checkDependencies() {
  const backendNodeModules = path.join(__dirname, '..', 'backend', 'node_modules');
  const missingDeps = [];
  const foundDeps = [];
  
  console.log('📁 Checking backend dependencies...');
  
  for (const dep of criticalDependencies) {
    const depPath = path.join(backendNodeModules, dep);
    if (fs.existsSync(depPath)) {
      foundDeps.push(dep);
      console.log(`✅ ${dep}`);
    } else {
      missingDeps.push(dep);
      console.log(`❌ ${dep} - MISSING`);
    }
  }
  
  console.log('\n📊 Dependency Check Summary:');
  console.log(`✅ Found: ${foundDeps.length}/${criticalDependencies.length}`);
  console.log(`❌ Missing: ${missingDeps.length}/${criticalDependencies.length}`);
  
  if (missingDeps.length > 0) {
    console.log('\n❌ Missing dependencies:');
    missingDeps.forEach(dep => console.log(`  - ${dep}`));
    console.log('\n💡 Run "pnpm fix:deps" to install missing dependencies');
    return false;
  } else {
    console.log('\n🎉 All dependencies are present!');
    return true;
  }
}

// 检查前端依赖
function checkFrontendDependencies() {
  const frontendNodeModules = path.join(__dirname, '..', 'frontend', 'node_modules');
  const criticalFrontendDeps = ['react', 'react-dom', 'react-scripts'];
  
  console.log('\n📁 Checking frontend dependencies...');
  
  for (const dep of criticalFrontendDeps) {
    const depPath = path.join(frontendNodeModules, dep);
    if (fs.existsSync(depPath)) {
      console.log(`✅ ${dep}`);
    } else {
      console.log(`❌ ${dep} - MISSING`);
    }
  }
}

// 主函数
function main() {
  const backendOk = checkDependencies();
  checkFrontendDependencies();
  
  if (!backendOk) {
    console.log('\n🚨 Backend dependencies are incomplete!');
    process.exit(1);
  } else {
    console.log('\n✅ All dependencies are ready!');
    console.log('💡 You can now run: pnpm dev:fast');
  }
}

main();
