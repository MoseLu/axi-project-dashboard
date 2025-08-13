import React from 'react';
import { Card, Typography, Space, Button, List } from 'antd';
import { Link } from 'react-router-dom';
import { 
  HomeOutlined, 
  DeploymentUnitOutlined, 
  ProjectOutlined,
  RightOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const BreadcrumbTestPage: React.FC = () => {
  const testRoutes = [
    {
      title: '部署管理',
      icon: <DeploymentUnitOutlined />,
      routes: [
        { path: '/deployments', name: '部署概览' },
        { path: '/deployments/history', name: '部署历史' },
        { path: '/deployments/config', name: '部署配置' },
      ]
    },
    {
      title: '项目管理',
      icon: <ProjectOutlined />,
      routes: [
        { path: '/projects', name: '项目列表' },
        { path: '/projects/list', name: '所有项目' },
      ]
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card className="glass-card" style={{ marginBottom: '24px' }}>
        <Title level={2} className="content-title">
          <HomeOutlined style={{ marginRight: '8px' }} />
          面包屑功能测试
        </Title>
        <Text className="content-text-secondary">
          点击下面的链接测试不同层级的面包屑导航功能
        </Text>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {testRoutes.map((section, index) => (
          <Card key={index} className="glass-card">
            <Title level={4} className="content-title">
              {section.icon} {section.title}
            </Title>
            <List
              dataSource={section.routes}
              renderItem={(route) => (
                <List.Item>
                  <Link to={route.path}>
                    <Button type="link" style={{ padding: '8px 16px' }}>
                      <RightOutlined style={{ marginRight: '8px' }} />
                      {route.name}
                    </Button>
                  </Link>
                </List.Item>
              )}
            />
          </Card>
        ))}
      </div>

      {/* 404页面测试 */}
      <Card className="glass-card" style={{ marginBottom: '24px' }}>
        <Title level={4} className="content-title">
          <ExclamationCircleOutlined style={{ marginRight: '8px', color: '#ff4d4f' }} />
          404页面测试
        </Title>
        <Text className="content-text-secondary" style={{ marginBottom: '16px', display: 'block' }}>
          测试404页面是否正确显示在内容区域内
        </Text>
        <Space>
          <Link to="/non-existent-page">
            <Button type="primary" danger>
              访问不存在的页面
            </Button>
          </Link>
          <Link to="/test/404">
            <Button danger>
              访问404测试路径
            </Button>
          </Link>
          <Link to="/invalid/route/test">
            <Button danger>
              访问无效路由
            </Button>
          </Link>
        </Space>
      </Card>

      <Card className="glass-card">
        <Title level={4} className="content-title">面包屑功能说明</Title>
        <div style={{ paddingLeft: '20px' }}>
          <ul style={{ color: 'var(--content-text-secondary)' }}>
            <li>面包屑会自动显示当前页面的层级路径</li>
            <li>支持二级和三级路由导航</li>
            <li>每个面包屑项都可以点击跳转</li>
            <li>动态路由参数会正确显示</li>
            <li>面包屑样式与整体设计保持一致</li>
            <li><strong>404页面现在正确显示在内容区域内，不会超出MainLayout布局</strong></li>
          </ul>
        </div>
      </Card>
    </div>
  );
};

export default BreadcrumbTestPage;
