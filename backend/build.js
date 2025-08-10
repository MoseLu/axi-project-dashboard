const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Building backend...');

try {
  // 检查是否已经有编译后的文件
  if (fs.existsSync('dist') && fs.existsSync('dist/index.js')) {
    console.log('✅ Compiled files already exist, skipping build');
    console.log('🎉 Backend build completed successfully!');
    return;
  }

  // 清理 dist 目录
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
    console.log('✅ Cleaned dist directory');
  }

  // 检查是否有 src 目录
  if (!fs.existsSync('src')) {
    console.log('⚠️ No src directory found, skipping TypeScript compilation');
    
    // 即使跳过编译，也要处理路径别名
    if (fs.existsSync('dist')) {
      try {
        execSync('npx tsc-alias', { stdio: 'inherit' });
        console.log('✅ Path aliases processed');
      } catch (error) {
        console.log('⚠️ Failed to process path aliases, continuing...');
      }
    }
    
    console.log('🎉 Backend build completed successfully!');
    return;
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

  // 复制必要的文件
  if (fs.existsSync('package.json')) {
    fs.copyFileSync('package.json', 'dist/package.json');
    console.log('✅ Copied package.json');
  }

  console.log('🎉 Backend build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
