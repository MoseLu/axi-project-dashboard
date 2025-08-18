const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// 诊断配置
const config = {
  containers: [
    'axi-project-dashboard-backend',
    'axi-project-dashboard-frontend',
    'nginx'
  ],
  ports: [8090, 3000, 80],
  networks: ['axi-project-dashboard_default']
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

// 检查Docker容器状态
async function checkContainers() {
  console.log('🔍 检查Docker容器状态...\n');
  
  const result = await runCommand('docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"');
  
  if (result.success) {
    console.log(result.output);
  } else {
    console.log('❌ 无法获取容器状态:', result.error);
  }
  
  console.log('');
}

// 检查Docker网络
async function checkNetworks() {
  console.log('🌐 检查Docker网络...\n');
  
  const result = await runCommand('docker network ls');
  
  if (result.success) {
    console.log(result.output);
  } else {
    console.log('❌ 无法获取网络列表:', result.error);
  }
  
  console.log('');
}

// 检查网络详情
async function checkNetworkDetails() {
  console.log('🔧 检查网络详情...\n');
  
  for (const network of config.networks) {
    console.log(`检查网络: ${network}`);
    const result = await runCommand(`docker network inspect ${network}`);
    
    if (result.success) {
      try {
        const networkInfo = JSON.parse(result.output);
        console.log(`✅ 网络存在`);
        console.log(`   驱动: ${networkInfo[0]?.Driver || 'unknown'}`);
        console.log(`   子网: ${networkInfo[0]?.IPAM?.Config?.[0]?.Subnet || 'unknown'}`);
        console.log(`   容器数量: ${Object.keys(networkInfo[0]?.Containers || {}).length}`);
        
        // 显示连接的容器
        if (networkInfo[0]?.Containers) {
          console.log('   连接的容器:');
          Object.entries(networkInfo[0].Containers).forEach(([containerId, containerInfo]) => {
            console.log(`     - ${containerInfo.Name}: ${containerInfo.IPv4Address}`);
          });
        }
      } catch (error) {
        console.log('❌ 解析网络信息失败:', error.message);
      }
    } else {
      console.log(`❌ 网络不存在或无法访问`);
    }
    console.log('');
  }
}

// 检查端口映射
async function checkPortMappings() {
  console.log('🔌 检查端口映射...\n');
  
  for (const container of config.containers) {
    console.log(`检查容器: ${container}`);
    const result = await runCommand(`docker port ${container}`);
    
    if (result.success) {
      console.log(result.output || '   无端口映射');
    } else {
      console.log('   ❌ 容器不存在或无法访问');
    }
    console.log('');
  }
}

// 检查容器间连通性
async function checkConnectivity() {
  console.log('🌍 检查容器间连通性...\n');
  
  // 检查后端容器是否能够ping通nginx
  console.log('检查后端 -> nginx 连通性:');
  const pingResult = await runCommand('docker exec axi-project-dashboard-backend ping -c 3 nginx');
  
  if (pingResult.success) {
    console.log('✅ 后端可以ping通nginx');
  } else {
    console.log('❌ 后端无法ping通nginx');
    console.log('错误:', pingResult.error);
  }
  
  console.log('');
  
  // 检查后端服务是否在监听8090端口
  console.log('检查后端服务端口监听:');
  const portResult = await runCommand('docker exec axi-project-dashboard-backend netstat -tlnp | grep 8090');
  
  if (portResult.success) {
    console.log('✅ 后端服务正在监听8090端口');
    console.log(portResult.output);
  } else {
    console.log('❌ 后端服务未监听8090端口');
  }
  
  console.log('');
}

// 检查nginx配置
async function checkNginxConfig() {
  console.log('⚙️ 检查nginx配置...\n');
  
  const result = await runCommand('docker exec nginx nginx -t');
  
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
  
  const result = await runCommand('docker exec nginx tail -20 /var/log/nginx/error.log');
  
  if (result.success) {
    console.log('最近的nginx错误日志:');
    console.log(result.output);
  } else {
    console.log('❌ 无法获取nginx错误日志');
  }
  
  console.log('');
}

// 检查后端日志
async function checkBackendLogs() {
  console.log('📋 检查后端日志...\n');
  
  const result = await runCommand('docker logs --tail 20 axi-project-dashboard-backend');
  
  if (result.success) {
    console.log('最近的后端日志:');
    console.log(result.output);
  } else {
    console.log('❌ 无法获取后端日志');
  }
  
  console.log('');
}

// 主诊断函数
async function runDiagnosis() {
  console.log('🚀 开始Docker网络诊断...\n');
  
  await checkContainers();
  await checkNetworks();
  await checkNetworkDetails();
  await checkPortMappings();
  await checkConnectivity();
  await checkNginxConfig();
  await checkNginxLogs();
  await checkBackendLogs();
  
  console.log('📋 诊断建议:');
  console.log('1. 确保所有容器都在同一个Docker网络中');
  console.log('2. 检查后端容器是否正在运行并监听8090端口');
  console.log('3. 验证nginx配置中的upstream地址是否正确');
  console.log('4. 检查防火墙和SELinux设置');
  console.log('5. 确保Docker网络配置正确');
  console.log('');
  console.log('🔧 可能的解决方案:');
  console.log('- 重启所有容器: docker-compose restart');
  console.log('- 重新创建网络: docker-compose down && docker-compose up -d');
  console.log('- 检查后端服务启动日志');
  console.log('- 验证nginx upstream配置');
}

// 运行诊断
runDiagnosis().catch(console.error);
