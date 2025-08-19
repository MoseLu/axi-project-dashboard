#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 开始初始化监控数据...');

try {
  // 运行 TypeScript 初始化脚本
  const scriptPath = path.join(__dirname, 'src/scripts/init-monitoring-data.ts');
  
  console.log('📝 运行监控数据初始化脚本...');
  execSync(`npx ts-node ${scriptPath}`, { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  
  console.log('✅ 监控数据初始化完成！');
  console.log('📊 现在监控页面应该能显示项目数据了');
  
} catch (error) {
  console.error('❌ 监控数据初始化失败:', error.message);
  process.exit(1);
}
