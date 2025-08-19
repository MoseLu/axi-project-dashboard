const io = require('socket.io-client');

console.log('🔍 详细WebSocket连接调试...');

// 测试不同的配置
const testConfigs = [
  {
    name: '标准配置',
    url: 'http://localhost:8081',
    path: '/project-dashboard/ws/socket.io',
    options: {
      transports: ['polling', 'websocket'],
      timeout: 10000,
      forceNew: true
    }
  },
  {
    name: '仅WebSocket',
    url: 'http://localhost:8081',
    path: '/project-dashboard/ws/socket.io',
    options: {
      transports: ['websocket'],
      timeout: 10000,
      forceNew: true
    }
  },
  {
    name: '仅Polling',
    url: 'http://localhost:8081',
    path: '/project-dashboard/ws/socket.io',
    options: {
      transports: ['polling'],
      timeout: 10000,
      forceNew: true
    }
  }
];

async function testConnection(config) {
  return new Promise((resolve) => {
    console.log(`\n🔍 测试: ${config.name}`);
    console.log(`URL: ${config.url}`);
    console.log(`Path: ${config.path}`);
    
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
      console.log('Transport:', socket.io.engine.transport.name);
      socket.disconnect();
      resolve({ success: true });
    });
    
    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      console.log('❌ 连接错误:', error.message);
      console.log('错误类型:', error.type);
      console.log('错误描述:', error.description);
      resolve({ success: false, error: error.message });
    });
    
    socket.on('error', (error) => {
      console.log('❌ Socket错误:', error);
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
      const result = await testConnection(config);
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
