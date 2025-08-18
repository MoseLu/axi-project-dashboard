import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;
import PortRegistryManager from '../components/port-registry/PortRegistryManager';

const PortRegistryPage: React.FC = () => {
  return (
    <div>
      <div style={{ padding: '24px 24px 0', borderBottom: '1px solid #f0f0f0' }}>
        <Title level={2}>端口注册管理</Title>
        <p style={{ color: '#666', margin: '8px 0 0 0' }}>
          管理项目端口分配，实现全链路监控
        </p>
      </div>
      <PortRegistryManager />
    </div>
  );
};

export default PortRegistryPage;
