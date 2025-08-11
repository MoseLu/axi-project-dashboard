// 使用内置的 fetch (Node.js 18+)

async function testDeploymentNotification() {
  const testData = {
    project: 'axi-docs',
    status: 'success',
    duration: 45,
    timestamp: new Date().toISOString(),
    sourceRepo: 'MoseLu/axi-docs',
    runId: '123456789',
    deployType: 'static',
    serverHost: 'redamancy.com.cn',
    logs: '测试部署通知',
    errorMessage: ''
  };

  try {
    console.log('📤 发送测试部署通知...');
    console.log('数据:', JSON.stringify(testData, null, 2));

    const response = await fetch('http://localhost:8081/api/webhooks/deployment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'test-script/1.0'
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('📊 响应状态:', response.status);
    console.log('📊 响应内容:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('✅ 测试部署通知发送成功！');
    } else {
      console.log('❌ 测试部署通知发送失败');
    }
  } catch (error) {
    console.error('❌ 发送测试部署通知时出错:', error.message);
  }
}

testDeploymentNotification();
