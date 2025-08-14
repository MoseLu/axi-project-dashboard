#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

console.log('🚀 启动 axi-project-dashboard 后端服务...');

// 检查可能的启动文件路径
const possiblePaths = [
  './dist/index.js',           // 编译后的文件
  './src/index.ts',            // TypeScript 源文件
  './src/index.js',            // JavaScript 源文件
  '../dist/index.js',          // 相对路径
  '../src/index.ts',           // 相对路径
  path.join(__dirname, 'dist', 'index.js'),  // 绝对路径
  path.join(__dirname, 'src', 'index.ts'),   // 绝对路径
];

let startFile = null;

// 查找可用的启动文件
for (const filePath of possiblePaths) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ 找到启动文件: ${filePath}`);
    startFile = filePath;
    break;
  }
}

if (!startFile) {
  console.error('❌ 未找到可用的启动文件');
  console.error('📋 检查的文件路径:');
  possiblePaths.forEach(p => console.error(`   - ${p}`));
  process.exit(1);
}

try {
  console.log(`🚀 正在启动: ${startFile}`);
  
  // 如果是 TypeScript 文件，需要特殊处理
  if (startFile.endsWith('.ts')) {
    // 尝试使用 ts-node 运行
    try {
      require('ts-node/register');
      require(startFile);
    } catch (error) {
      console.error('❌ 无法运行 TypeScript 文件，请确保已安装 ts-node');
      console.error('💡 建议: npm install -g ts-node 或使用编译后的 JavaScript 文件');
      process.exit(1);
    }
  } else {
    // 运行 JavaScript 文件
    require(startFile);
  }
  
} catch (error) {
  console.error('❌ 启动失败:', error.message);
  console.error('📋 错误详情:', error);
  process.exit(1);
}
