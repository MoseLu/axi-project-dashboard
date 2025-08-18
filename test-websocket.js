const { io } = require('socket.io-client');

// 测试配置
const testConfigs = [
  {
    name: '生产环境测试',
    url: 'wss://redamancy.com.cn',
    path: '/ws/socket.io',
    options: {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      timeout: 10000,
      forceNew: true
    }
  },
  {
    name: '本地测试',
    url: 'http://localhost:8081',
    path: '/ws/socket.io',
    options: {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      timeout: 10000,
      forceNew: true
    }
  }
];

async function testWebSocketConnection(config) {
  console.log(`\n🔍 测试: ${config.name}`);
  console.log(`URL: ${config.url}`);
  console.log(`Path: ${config.path}`);
  console.log('Options:', JSON.stringify(config.options, null, 2));
  
  return new Promise((resolve) => {
    const socket = io(config.url, config.options);
    
    const timeout = setTimeout(() => {
      console.log('❌ 连接超时');
      socket.disconnect();
      resolve({ success: false, error: 'timeout' });
    }, 15000);
    
    socket.on('connect', () => {
      clearTimeout(timeout);
      console.log('✅ 连接成功!');
      console.log('Socket ID:', socket.id);
      socket.disconnect();
      resolve({ success: true });
    });
    
    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      console.log('❌ 连接错误:', error.message);
      console.log('错误详情:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      resolve({ success: false, error: error.message });
    });
    
    socket.on('disconnect', (reason) => {
      console.log('🔌 连接断开:', reason);
    });
  });
}

async function runTests() {
  console.log('🚀 开始WebSocket连接测试...\n');
  
  for (const config of testConfigs) {
    try {
      const result = await testWebSocketConnection(config);
      console.log(`结果: ${result.success ? '✅ 成功' : '❌ 失败'}`);
      if (!result.success) {
        console.log(`错误: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ 测试异常: ${error.message}`);
    }
    
    // 等待一下再进行下一个测试
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n🏁 测试完成');
}

// 运行测试
runTests().catch(console.error);
