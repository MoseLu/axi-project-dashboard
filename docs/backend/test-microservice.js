const axios = require('axios');

const BASE_URL = 'http://localhost:8090/api';

async function testMicroserviceArchitecture() {
  console.log('🧪 开始测试微服务架构...\n');

  try {
    // 1. 测试监控状态
    console.log('1️⃣ 测试监控状态 API...');
    const statusResponse = await axios.get(`${BASE_URL}/monitoring/status`);
    console.log('✅ 监控状态:', statusResponse.data);
    console.log('');

    // 2. 测试发布部署事件
    console.log('2️⃣ 测试发布部署事件...');
    const deploymentEvent = {
      project: 'axi-star-cloud',
      repository: 'axi-star-cloud',
      branch: 'main',
      commit_hash: 'test-commit-123',
      status: 'running',
      job_name: 'deploy',
      step_name: 'build',
      step_status: 'running'
    };
    
    const deploymentResponse = await axios.post(
      `${BASE_URL}/monitoring/publish-deployment`,
      deploymentEvent
    );
    console.log('✅ 部署事件发布成功:', deploymentResponse.data);
    console.log('');

    // 3. 测试发布项目状态事件
    console.log('3️⃣ 测试发布项目状态事件...');
    const projectStatusEvent = {
      project: 'axi-star-cloud',
      isRunning: true,
      port: 3000,
      memoryUsage: 512,
      diskUsage: 1024,
      cpuUsage: 15.5,
      uptime: 3600,
      url: 'https://redamancy.com.cn'
    };
    
    const projectStatusResponse = await axios.post(
      `${BASE_URL}/monitoring/publish-project-status`,
      projectStatusEvent
    );
    console.log('✅ 项目状态事件发布成功:', projectStatusResponse.data);
    console.log('');

    // 4. 测试发布系统事件
    console.log('4️⃣ 测试发布系统事件...');
    const systemEvent = {
      type: 'health.check',
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: ['api', 'websocket', 'monitor']
      }
    };
    
    const systemResponse = await axios.post(
      `${BASE_URL}/monitoring/publish-system`,
      systemEvent
    );
    console.log('✅ 系统事件发布成功:', systemResponse.data);
    console.log('');

    // 5. 测试手动触发监控
    console.log('5️⃣ 测试手动触发监控...');
    const triggerResponse = await axios.post(`${BASE_URL}/monitoring/trigger`);
    console.log('✅ 手动监控触发成功:', triggerResponse.data);
    console.log('');

    // 6. 测试获取项目状态
    console.log('6️⃣ 测试获取项目状态...');
    const projectsResponse = await axios.get(`${BASE_URL}/monitoring/projects/status`);
    console.log('✅ 项目状态获取成功:', projectsResponse.data);
    console.log('');

    // 7. 测试获取最近部署记录
    console.log('7️⃣ 测试获取最近部署记录...');
    const deploymentsResponse = await axios.get(`${BASE_URL}/monitoring/deployments/recent?limit=5`);
    console.log('✅ 最近部署记录获取成功:', deploymentsResponse.data);
    console.log('');

    console.log('🎉 所有测试通过！微服务架构运行正常。');

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 提示: 请确保后端服务正在运行:');
      console.log('   pm2 start ecosystem.config.js');
      console.log('   或者: node backend/start-simple.js');
    }
  }
}

// 运行测试
testMicroserviceArchitecture();
