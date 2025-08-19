#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 修复生产环境nginx WebSocket配置...');

// 读取原始nginx配置
const nginxConfigPath = path.join(__dirname, 'config', 'nginx.conf');
const nginxConfig = fs.readFileSync(nginxConfigPath, 'utf8');

console.log('📄 读取nginx配置文件:', nginxConfigPath);

// 检查当前配置
if (nginxConfig.includes('server backend:8090')) {
  console.log('⚠️  发现Docker容器配置: backend:8090');
  console.log('💡 这可能是502错误的原因');
} else {
  console.log('✅ 未发现Docker容器配置');
}

if (nginxConfig.includes('server frontend:3000')) {
  console.log('⚠️  发现Docker容器配置: frontend:3000');
} else {
  console.log('✅ 未发现Docker容器配置');
}

// 创建生产环境修复配置
const productionConfig = nginxConfig
  .replace(/server backend:8090/g, 'server 127.0.0.1:8090')
  .replace(/server frontend:3000/g, 'server 127.0.0.1:3000');

// 检查是否有变化
if (productionConfig !== nginxConfig) {
  console.log('🔄 应用生产环境修复...');
  
  // 备份原始配置
  const backupPath = path.join(__dirname, 'config', 'nginx.conf.backup');
  fs.writeFileSync(backupPath, nginxConfig);
  console.log('💾 备份原始配置到:', backupPath);
  
  // 写入修复后的配置
  fs.writeFileSync(nginxConfigPath, productionConfig);
  console.log('✅ 已修复nginx配置');
  
  console.log('\n📋 修复内容:');
  console.log('- backend:8090 -> 127.0.0.1:8090');
  console.log('- frontend:3000 -> 127.0.0.1:3000');
  
} else {
  console.log('✅ 配置已经是生产环境格式');
}

// 验证修复结果
const updatedConfig = fs.readFileSync(nginxConfigPath, 'utf8');
if (updatedConfig.includes('server 127.0.0.1:8090')) {
  console.log('✅ 验证成功: 后端配置已修复');
} else {
  console.log('❌ 验证失败: 后端配置未修复');
}

if (updatedConfig.includes('server 127.0.0.1:3000')) {
  console.log('✅ 验证成功: 前端配置已修复');
} else {
  console.log('❌ 验证失败: 前端配置未修复');
}

console.log('\n📝 下一步操作:');
console.log('1. 重新加载nginx配置: nginx -s reload');
console.log('2. 或者重启nginx服务: systemctl restart nginx');
console.log('3. 检查nginx错误日志: tail -f /var/log/nginx/error.log');
console.log('4. 测试WebSocket连接');

console.log('\n🔍 如果问题仍然存在，请检查:');
console.log('- 后端服务是否在127.0.0.1:8090运行');
console.log('- 前端服务是否在127.0.0.1:3000运行');
console.log('- nginx是否有权限访问这些端口');
console.log('- 防火墙是否阻止了连接');

console.log('\n✅ 修复完成!');
