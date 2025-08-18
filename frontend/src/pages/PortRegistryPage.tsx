import React from 'react';
import { PageHeader } from '@ant-design/pro-layout';
import PortRegistryManager from '../components/port-registry/PortRegistryManager';

const PortRegistryPage: React.FC = () => {
  return (
    <div>
      <PageHeader
        title="端口注册管理"
        subTitle="管理项目端口分配，实现全链路监控"
        ghost={false}
        style={{
          border: '1px solid rgb(235, 237, 240)',
        }}
      />
      <PortRegistryManager />
    </div>
  );
};

export default PortRegistryPage;
