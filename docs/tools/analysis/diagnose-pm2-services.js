const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// 诊断配置
const config = {
  services: [
    'dashboard-backend',
    'dashboard-frontend'
  ],
  ports: [8090, 3000],
  endpoints: [
    'http://localhost:8090/health',
    'http://localhost:3000',
    'http://localhost:8090/project-dashboard/api/health'
  ]
};

// 执行命令并返回结果
async function runCommand(command) {
  try {
    const { stdout, stderr } = await execAsync(command);
    return { success: true, output: stdout, error: stderr };
  } catch (error) {
    return { success: false, output: error.stdout, error: error.stderr };
  }
}

// 检查PM2进程状态
async function checkPM2Processes() {
  console.log('🔍 检查PM2进程状态...\n');
  
  const result = await runCommand('pm2 list');
  
  if (result.success) {
    console.log(result.output);
  } else {
    console.log('❌ 无法获取PM2进程列表:', result.error);
    console.log('💡 可能PM2未安装或未运行');
  }
  
  console.log('');
}

// 检查PM2日志
async function checkPM2Logs() {
  console.log('📋 检查PM2日志...\n');
  
  for (const service of config.services) {
    console.log(`检查 ${service} 日志:`);
    const result = await runCommand(`pm2 logs ${service} --lines 10 --nostream`);
    
    if (result.success) {
      console.log(result.output);
    } else {
      console.log(`❌ 无法获取 ${service} 日志:`, result.error);
    }
    console.log('');
  }
}

// 检查端口监听
async function checkPortListening() {
  console.log('🔌 检查端口监听状态...\n');
  
  for (const port of config.ports) {
    console.log(`检查端口 ${port}:`);
    const result = await runCommand(`netstat -tlnp | grep :${port}`);
    
    if (result.success) {
      console.log(`✅ 端口 ${port} 正在监听:`);
      console.log(result.output);
    } else {
      console.log(`❌ 端口 ${port} 未监听`);
    }
    console.log('');
  }
}

// 检查服务健康状态
async function checkServiceHealth() {
  console.log('🏥 检查服务健康状态...\n');
  
  for (const endpoint of config.endpoints) {
    console.log(`检查端点: ${endpoint}`);
    
    try {
      const result = await runCommand(`curl -s -o /dev/null -w "%{http_code}" ${endpoint}`);
      
      if (result.success) {
        const statusCode = result.output.trim();
        if (statusCode === '200') {
          console.log(`✅ ${endpoint} - 状态码: ${statusCode}`);
        } else {
          console.log(`⚠️ ${endpoint} - 状态码: ${statusCode}`);
        }
      } else {
        console.log(`❌ ${endpoint} - 连接失败`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - 请求失败:`, error.message);
    }
    console.log('');
  }
}

// 检查nginx配置
async function checkNginxConfig() {
  console.log('⚙️ 检查nginx配置...\n');
  
  const result = await runCommand('nginx -t');
  
  if (result.success) {
    console.log('✅ nginx配置语法正确');
  } else {
    console.log('❌ nginx配置语法错误');
    console.log('错误:', result.error);
  }
  
  console.log('');
}

// 检查nginx错误日志
async function checkNginxLogs() {
  console.log('📋 检查nginx错误日志...\n');
  
  const result = await runCommand('tail -20 /var/log/nginx/error.log');
  
  if (result.success) {
    console.log('最近的nginx错误日志:');
    console.log(result.output);
  } else {
    console.log('❌ 无法获取nginx错误日志');
  }
  
  console.log('');
}

// 检查系统资源
async function checkSystemResources() {
  console.log('💻 检查系统资源...\n');
  
  // 检查内存使用
  const memoryResult = await runCommand('free -h');
  if (memoryResult.success) {
    console.log('内存使用情况:');
    console.log(memoryResult.output);
  }
  
  console.log('');
  
  // 检查磁盘使用
  const diskResult = await runCommand('df -h');
  if (diskResult.success) {
    console.log('磁盘使用情况:');
    console.log(diskResult.output);
  }
  
  console.log('');
  
  // 检查进程资源使用
  const processResult = await runCommand('ps aux | grep -E "(dashboard-backend|dashboard-frontend)" | grep -v grep');
  if (processResult.success) {
    console.log('PM2进程资源使用:');
    console.log(processResult.output);
  } else {
    console.log('未找到PM2进程');
  }
  
  console.log('');
}

// 检查网络连接
async function checkNetworkConnectivity() {
  console.log('🌍 检查网络连接...\n');
  
  // 检查本地回环
  const localhostResult = await runCommand('ping -c 3 127.0.0.1');
  if (localhostResult.success) {
    console.log('✅ 本地回环连接正常');
  } else {
    console.log('❌ 本地回环连接失败');
  }
  
  console.log('');
  
  // 检查外部连接
  const externalResult = await runCommand('ping -c 3 8.8.8.8');
  if (externalResult.success) {
    console.log('✅ 外部网络连接正常');
  } else {
    console.log('❌ 外部网络连接失败');
  }
  
  console.log('');
}

// 主诊断函数
async function runDiagnosis() {
  console.log('🚀 开始PM2服务诊断...\n');
  
  await checkPM2Processes();
  await checkPM2Logs();
  await checkPortListening();
  await checkServiceHealth();
  await checkNginxConfig();
  await checkNginxLogs();
  await checkSystemResources();
  await checkNetworkConnectivity();
  
  console.log('📋 诊断建议:');
  console.log('1. 确保PM2已安装并运行: npm install -g pm2');
  console.log('2. 启动服务: pm2 start ecosystem.config.js');
  console.log('3. 检查服务状态: pm2 status');
  console.log('4. 查看详细日志: pm2 logs');
  console.log('5. 重启服务: pm2 restart all');
  console.log('');
  console.log('🔧 可能的解决方案:');
  console.log('- 重启PM2服务: pm2 restart all');
  console.log('- 重新加载配置: pm2 reload ecosystem.config.js');
  console.log('- 检查端口冲突: netstat -tlnp | grep :8090');
  console.log('- 检查nginx配置: nginx -t');
  console.log('- 重启nginx: systemctl restart nginx');
  console.log('');
  console.log('💡 如果服务未启动，请运行:');
  console.log('cd /srv/apps/axi-project-dashboard');
  console.log('pm2 start ecosystem.config.js');
}

// 运行诊断
runDiagnosis().catch(console.error);
