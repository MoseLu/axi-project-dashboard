const axios = require('axios');

const API_BASE = 'http://localhost:8081/project-dashboard/api';

async function testAPI() {
  console.log('🧪 测试 axi-project-dashboard API 接口...\n');

  try {
    // 测试健康检查
    console.log('1. 测试健康检查接口...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log('✅ 健康检查成功:', healthResponse.data.message);
    console.log('   版本:', healthResponse.data.version);
    console.log('   运行时间:', Math.round(healthResponse.data.uptime), '秒\n');

    // 测试部署历史接口
    console.log('2. 测试部署历史接口...');
    const historyResponse = await axios.get(`${API_BASE}/deployments/history`);
    console.log('✅ 部署历史接口成功');
    console.log('   数据条数:', historyResponse.data.data.length);
    console.log('   分页信息:', historyResponse.data.pagination);
    console.log('   响应消息:', historyResponse.data.message, '\n');

    // 测试部署列表接口
    console.log('3. 测试部署列表接口...');
    const deploymentsResponse = await axios.get(`${API_BASE}/deployments`);
    console.log('✅ 部署列表接口成功');
    console.log('   数据条数:', deploymentsResponse.data.data.length);
    console.log('   分页信息:', deploymentsResponse.data.pagination);
    console.log('   响应消息:', deploymentsResponse.data.message, '\n');

    // 测试指标接口
    console.log('4. 测试指标接口...');
    const metricsResponse = await axios.get(`${API_BASE}/metrics`);
    console.log('✅ 指标接口成功');
    console.log('   总部署数:', metricsResponse.data.data.totalDeployments);
    console.log('   成功部署数:', metricsResponse.data.data.successfulDeployments);
    console.log('   失败部署数:', metricsResponse.data.data.failedDeployments);
    console.log('   平均部署时间:', metricsResponse.data.data.averageDeploymentTime, '秒\n');

    console.log('🎉 所有API接口测试通过！');
    console.log('📝 现在前端应该能够正确显示真实的部署数据（虽然目前是空的）');

  } catch (error) {
    console.error('❌ API测试失败:', error.message);
    
    if (error.response) {
      console.error('   状态码:', error.response.status);
      console.error('   响应数据:', error.response.data);
    }
    
    console.log('\n💡 请确保后端服务正在运行: pnpm start');
  }
}

// 运行测试
testAPI();
