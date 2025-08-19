const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// 启动时间分析配置
const config = {
  steps: [
    { name: '依赖检查', command: 'ls -la node_modules | wc -l', expected: '> 0' },
    { name: 'PM2安装检查', command: 'which pm2', expected: 'pm2 found' },
    { name: '端口占用检查', command: 'netstat -tlnp | grep :8090', expected: 'port free' },
    { name: '构建产物检查', command: 'ls -la frontend/dist backend/dist', expected: 'files exist' },
    { name: '磁盘空间检查', command: 'df -h .', expected: 'space available' },
    { name: '内存使用检查', command: 'free -h', expected: 'memory available' }
  ]
};

// 执行命令并计时
async function runCommandWithTimer(command, stepName) {
  const startTime = Date.now();
  try {
    const { stdout, stderr } = await execAsync(command);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return {
      success: true,
      output: stdout,
      error: stderr,
      duration,
      stepName
    };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return {
      success: false,
      output: error.stdout,
      error: error.stderr,
      duration,
      stepName
    };
  }
}

// 分析启动时间
async function analyzeStartupTime() {
  console.log('🔍 分析启动时间瓶颈...\n');
  
  const results = [];
  let totalTime = 0;
  
  // 执行各个检查步骤
  for (const step of config.steps) {
    console.log(`⏱️ 检查: ${step.name}`);
    const result = await runCommandWithTimer(step.command, step.name);
    results.push(result);
    totalTime += result.duration;
    
    if (result.success) {
      console.log(`✅ ${step.name} - ${result.duration}ms`);
    } else {
      console.log(`❌ ${step.name} - ${result.duration}ms (失败)`);
    }
  }
  
  // 模拟PM2启动时间
  console.log('\n⏱️ 模拟PM2启动过程...');
  
  const pm2Steps = [
    { name: '停止现有服务', command: 'pm2 stop dashboard-backend dashboard-frontend 2>/dev/null || true', expected: 'fast' },
    { name: '删除现有服务', command: 'pm2 delete dashboard-backend dashboard-frontend 2>/dev/null || true', expected: 'fast' },
    { name: '启动服务', command: 'pm2 start ecosystem.config.js --update-env', expected: 'medium' },
    { name: '等待服务启动', command: 'sleep 2', expected: 'slow' },
    { name: '健康检查', command: 'curl -f http://localhost:8090/health > /dev/null 2>&1 || echo "not ready"', expected: 'medium' }
  ];
  
  for (const step of pm2Steps) {
    const result = await runCommandWithTimer(step.command, step.name);
    results.push(result);
    totalTime += result.duration;
    
    console.log(`⏱️ ${step.name} - ${result.duration}ms`);
  }
  
  // 分析结果
  console.log('\n📊 启动时间分析结果:');
  console.log(`总时间: ${totalTime}ms (${(totalTime/1000).toFixed(2)}s)`);
  
  // 按时间排序
  const sortedResults = results.sort((a, b) => b.duration - a.duration);
  
  console.log('\n🏆 耗时最长的步骤:');
  sortedResults.slice(0, 5).forEach((result, index) => {
    console.log(`${index + 1}. ${result.stepName} - ${result.duration}ms`);
  });
  
  // 优化建议
  console.log('\n💡 优化建议:');
  
  const slowSteps = results.filter(r => r.duration > 1000);
  if (slowSteps.length > 0) {
    console.log('发现慢速步骤:');
    slowSteps.forEach(step => {
      console.log(`- ${step.stepName}: ${step.duration}ms`);
      
      // 针对性的优化建议
      if (step.stepName.includes('依赖')) {
        console.log('  建议: 使用 --frozen-lockfile 或 npm ci 加速依赖安装');
      }
      if (step.stepName.includes('构建')) {
        console.log('  建议: 在CI/CD中预构建，避免运行时构建');
      }
      if (step.stepName.includes('健康检查')) {
        console.log('  建议: 减少健康检查重试次数和间隔时间');
      }
      if (step.stepName.includes('等待')) {
        console.log('  建议: 优化服务启动逻辑，减少等待时间');
      }
    });
  }
  
  // 快速启动建议
  console.log('\n🚀 快速启动建议:');
  console.log('1. 使用 ./start-fast.sh 脚本');
  console.log('2. 预构建前端和后端文件');
  console.log('3. 使用缓存依赖 (pnpm store)');
  console.log('4. 减少健康检查等待时间');
  console.log('5. 并行启动服务');
  
  // 性能基准
  console.log('\n📈 性能基准:');
  if (totalTime < 10000) {
    console.log('✅ 优秀 (< 10s)');
  } else if (totalTime < 30000) {
    console.log('⚠️ 一般 (10-30s)');
  } else {
    console.log('❌ 较慢 (> 30s)');
  }
  
  return {
    totalTime,
    results: sortedResults,
    slowSteps
  };
}

// 运行分析
analyzeStartupTime().catch(console.error);
