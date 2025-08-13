// 测试头像URL转换
const testAvatarUrl = () => {
  const avatarUrl = '/uploads/avatars/avatar-1755086643778-798026080.jpg';
  const fullUrl = `${window.location.origin}${avatarUrl}`;
  
  console.log('原始URL:', avatarUrl);
  console.log('完整URL:', fullUrl);
  console.log('当前域名:', window.location.origin);
  
  // 测试图片加载
  const img = new Image();
  img.onload = () => {
    console.log('✅ 图片加载成功');
  };
  img.onerror = () => {
    console.log('❌ 图片加载失败');
  };
  img.src = fullUrl;
};

// 测试用户状态
const testUserState = () => {
  const user = {
    id: 1,
    username: 'admin',
    avatar_url: '/uploads/avatars/avatar-1755086643778-798026080.jpg'
  };
  
  console.log('用户状态:', user);
  console.log('头像URL:', user.avatar_url);
  console.log('完整头像URL:', user.avatar_url ? `${window.location.origin}${user.avatar_url}` : undefined);
};

// 在浏览器控制台中运行
if (typeof window !== 'undefined') {
  window.testAvatarUrl = testAvatarUrl;
  window.testUserState = testUserState;
  console.log('测试函数已加载:');
  console.log('- testAvatarUrl() - 测试头像URL转换');
  console.log('- testUserState() - 测试用户状态');
}
