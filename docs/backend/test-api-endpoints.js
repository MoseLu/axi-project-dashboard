const axios = require('axios');

const BASE_URL = 'http://localhost:8090/api';

async function testApiEndpoints() {
  console.log('🧪 开始测试 API 端点...\n');

  const endpoints = [
    { name: '健康检查', path: '/health', method: 'GET' },
    { name: 'API 信息', path: '/info', method: 'GET' },
    { name: '监控状态', path: '/monitoring/status', method: 'GET' },
    { name: '项目状态', path: '/monitoring/projects/status', method: 'GET' },
    { name: '最近部署', path: '/monitoring/deployments/recent', method: 'GET' },
    { name: '所有部署', path: '/deployments', method: 'GET' },
    { name: '项目列表', path: '/projects', method: 'GET' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 测试 ${endpoint.name} (${endpoint.method} ${endpoint.path})...`);
      
      const response = await axios({
        method: endpoint.method,
        url: `${BASE_URL}${endpoint.path}`,
        timeout: 5000
      });

      console.log(`✅ ${endpoint.name} 成功 (${response.status})`);
      if (response.data && typeof response.data === 'object') {
        console.log(`   数据: ${JSON.stringify(response.data).substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name} 失败: ${error.response?.status || error.code || error.message}`);
      if (error.response?.data) {
        console.log(`   错误详情: ${JSON.stringify(error.response.data).substring(0, 100)}...`);
      }
    }
    console.log('');
  }

  console.log('🎉 API 端点测试完成！');
}

// 如果直接运行此脚本
if (require.main === module) {
  testApiEndpoints().catch(console.error);
}

module.exports = { testApiEndpoints };
