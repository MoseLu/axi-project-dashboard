const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Building backend...');

try {
  // 清理 dist 目录
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
    console.log('✅ Cleaned dist directory');
  }

  // 编译 TypeScript
  execSync('npx tsc', { stdio: 'inherit' });
  console.log('✅ TypeScript compilation completed');

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
