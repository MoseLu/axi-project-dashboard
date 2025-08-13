import React from 'react';
import { Card, Typography, Space, Button } from 'antd';
import { Link } from 'react-router-dom';

const { Title, Text } = Typography;

const Test404Page: React.FC = () => {
  return (
    <div style={{ padding: '24px' }}>
      <Card className="glass-card" style={{ marginBottom: '24px' }}>
        <Title level={3} className="content-title">404页面测试</Title>
        <Text className="content-text-secondary">
          这个页面用于测试404页面的效果。点击下面的链接可以测试不同的404场景：
        </Text>
        
        <Space style={{ marginTop: '16px' }}>
          <Link to="/non-existent-page">
            <Button type="primary">访问不存在的页面</Button>
          </Link>
          <Link to="/test/404">
            <Button>访问404测试路径</Button>
          </Link>
          <Link to="/invalid/route/test">
            <Button>访问无效路由</Button>
          </Link>
        </Space>
      </Card>
      
      <Card className="glass-card">
        <Title level={4} className="content-title">修改说明</Title>
        <Text className="content-text-secondary">
          <ul style={{ paddingLeft: '20px' }}>
            <li>404页面现在显示在内容区域而不是全屏</li>
            <li>使用了MainLayout包装，保持导航栏和侧边栏</li>
            <li>移除了全屏背景装饰，使用卡片样式</li>
            <li>保持了原有的动画效果和交互功能</li>
            <li>按钮样式与整体设计保持一致</li>
          </ul>
        </Text>
      </Card>
    </div>
  );
};

export default Test404Page;
