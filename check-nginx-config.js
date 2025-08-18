const https = require('https');
const http = require('http');

// 检查配置
const config = {
  baseUrl: 'https://redamancy.com.cn',
  endpoints: [
    '/project-dashboard/api/health',
    '/project-dashboard/ws/socket.io/',
    '/project-dashboard/websocket-test',
    '/health'
  ]
};

// 检查HTTP状态
async function checkEndpoint(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      resolve({
        url,
        status: res.statusCode,
        statusText: res.statusMessage,
        headers: res.headers,
        success: res.statusCode >= 200 && res.statusCode < 300
      });
    });
    
    req.on('error', (error) => {
      resolve({
        url,
        error: error.message,
        success: false
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        url,
        error: 'Timeout',
        success: false
      });
    });
  });
}

// 运行检查
async function runChecks() {
  console.log('🔍 开始检查nginx配置和WebSocket端点...\n');
  
  for (const endpoint of config.endpoints) {
    const url = `${config.baseUrl}${endpoint}`;
    console.log(`检查: ${url}`);
    
    try {
      const result = await checkEndpoint(url);
      
      if (result.success) {
        console.log(`✅ 成功 (${result.status})`);
        if (result.headers['content-type']) {
          console.log(`   内容类型: ${result.headers['content-type']}`);
        }
      } else {
        console.log(`❌ 失败 (${result.status || 'Error'})`);
        if (result.error) {
          console.log(`   错误: ${result.error}`);
        }
        if (result.status === 502) {
          console.log(`   💡 502错误通常表示nginx无法连接到后端服务`);
          console.log(`   💡 请检查后端服务是否正在运行`);
        }
      }
    } catch (error) {
      console.log(`❌ 异常: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('📋 诊断建议:');
  console.log('1. 如果所有端点都返回502，说明nginx无法连接到后端服务');
  console.log('2. 检查后端服务是否正在运行: docker ps | grep backend');
  console.log('3. 检查nginx配置: nginx -t');
  console.log('4. 检查nginx错误日志: tail -f /var/log/nginx/error.log');
  console.log('5. 检查后端服务日志: docker logs axi-project-dashboard-backend');
  console.log('');
  console.log('🔧 可能的解决方案:');
  console.log('- 重启后端服务: docker restart axi-project-dashboard-backend');
  console.log('- 重启nginx: docker restart nginx');
  console.log('- 检查防火墙设置');
  console.log('- 验证Docker网络配置');
}

// 运行检查
runChecks().catch(console.error);
