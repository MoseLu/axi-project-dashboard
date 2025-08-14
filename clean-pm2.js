#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🧹 清理 PM2 进程列表...');

try {
  // 检查当前 PM2 进程列表
  console.log('📋 当前 PM2 进程列表:');
  const pm2List = execSync('pm2 list', { encoding: 'utf8' });
  console.log(pm2List);
  
  // 检查是否有 dashboard-frontend 进程
  if (pm2List.includes('dashboard-frontend')) {
    console.log('⚠️  发现 dashboard-frontend 进程，正在删除...');
    execSync('pm2 delete dashboard-frontend', { stdio: 'inherit' });
  }
  
  // 检查是否有 dashboard-backend 进程
  if (pm2List.includes('dashboard-backend')) {
    console.log('⚠️  发现 dashboard-backend 进程，正在删除...');
    execSync('pm2 delete dashboard-backend', { stdio: 'inherit' });
  }
  
  // 清理 PM2 进程列表
  console.log('🧹 清理 PM2 进程列表...');
  execSync('pm2 kill', { stdio: 'inherit' });
  execSync('pm2 resurrect', { stdio: 'inherit' });
  
  // 显示清理后的进程列表
  console.log('📋 清理后的 PM2 进程列表:');
  const pm2ListAfter = execSync('pm2 list', { encoding: 'utf8' });
  console.log(pm2ListAfter);
  
  console.log('✅ PM2 进程列表清理完成');
  
} catch (error) {
  console.error('❌ 清理 PM2 进程列表失败:', error.message);
  process.exit(1);
}
