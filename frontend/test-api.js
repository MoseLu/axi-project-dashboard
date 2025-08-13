// 简单的 API 客户端测试
const testFormData = () => {
  const formData = new FormData();
  formData.append('avatar', new Blob(['test'], { type: 'image/jpeg' }), 'test.jpg');
  
  console.log('FormData 内容:');
  for (let [key, value] of formData.entries()) {
    console.log(key, value);
  }
  
  // 测试 fetch 请求
  fetch('http://localhost:8081/project-dashboard/api/auth/upload-avatar', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer test-token'
      // 注意：没有设置 Content-Type，让浏览器自动设置
    },
    body: formData
  })
  .then(response => {
    console.log('响应状态:', response.status);
    console.log('响应头:', response.headers.get('content-type'));
    return response.text();
  })
  .then(text => {
    console.log('响应内容:', text);
  })
  .catch(error => {
    console.error('请求失败:', error);
  });
};

// 在浏览器控制台中运行
if (typeof window !== 'undefined') {
  window.testFormData = testFormData;
  console.log('测试函数已加载，请在控制台运行 testFormData()');
}
