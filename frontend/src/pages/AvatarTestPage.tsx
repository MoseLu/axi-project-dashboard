import React, { useState } from 'react';
import { Card, Avatar, Button, Space, Typography, Upload, message, App } from 'antd';
import { UserOutlined, UploadOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { buildStaticUrl } from '../config/env';

const { Title, Text } = Typography;

const AvatarTestPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { message: antMessage } = App.useApp();
  const [uploading, setUploading] = useState(false);

  const handleAvatarUpload = async (file: File) => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('avatar', file);
      
      console.log('开始上传头像...');
      const response = await api.post('/auth/upload-avatar', formData);
      
      console.log('上传响应:', response);
      
      if (response.success) {
        console.log('头像上传成功，新URL:', response.data.avatar_url);
        updateUser({ avatar_url: response.data.avatar_url });
        antMessage.success('头像上传成功');
      } else {
        antMessage.error(response.message || '头像上传失败');
      }
    } catch (error) {
      console.error('头像上传失败:', error);
      antMessage.error('头像上传失败，请检查网络连接');
    } finally {
      setUploading(false);
    }
  };

  const uploadProps = {
    beforeUpload: (file: File) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        antMessage.error('只能上传图片文件！');
        return false;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        antMessage.error('图片大小不能超过2MB！');
        return false;
      }
      handleAvatarUpload(file);
      return false;
    },
    showUploadList: false,
  };

  const testImageLoad = () => {
    if (!user?.avatar_url) {
      antMessage.warning('没有头像URL');
      return;
    }
    
         const fullUrl = buildStaticUrl(user.avatar_url);
    console.log('测试图片URL:', fullUrl);
    
    const img = new Image();
    img.onload = () => {
      antMessage.success('图片加载成功！');
      console.log('✅ 图片加载成功');
    };
    img.onerror = () => {
      antMessage.error('图片加载失败！');
      console.log('❌ 图片加载失败');
    };
    img.src = fullUrl;
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>头像测试页面</Title>
      
      <Card title="当前用户信息" style={{ marginBottom: 16 }}>
        <Space direction="vertical">
          <Text>用户名: {user?.username}</Text>
          <Text>头像URL: {user?.avatar_url || '无'}</Text>
                     <Text>完整URL: {user?.avatar_url ? buildStaticUrl(user.avatar_url) : '无'}</Text>
        </Space>
      </Card>

      <Card title="头像显示测试" style={{ marginBottom: 16 }}>
        <Space direction="vertical" size="large">
          <div>
            <Text>当前头像:</Text>
                         <Avatar 
               size={64}
               src={user?.avatar_url ? buildStaticUrl(user.avatar_url) : undefined}
               icon={<UserOutlined />}
              onError={(e) => {
                console.error('头像加载失败:', user?.avatar_url);
                antMessage.error('头像加载失败');
              }}
            />
          </div>
          
          <Button onClick={testImageLoad}>
            测试图片加载
          </Button>
        </Space>
      </Card>

      <Card title="上传新头像">
        <Upload {...uploadProps}>
          <Button icon={<UploadOutlined />} loading={uploading}>
            选择图片上传
          </Button>
        </Upload>
      </Card>
    </div>
  );
};

export default AvatarTestPage;
