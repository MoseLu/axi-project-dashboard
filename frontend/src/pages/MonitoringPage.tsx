import React from 'react';
import { Typography } from 'antd';
import { RealTimeMonitor } from '../components/monitoring/RealTimeMonitor';

const { Title } = Typography;

const MonitoringPage: React.FC = () => {
  return (
    <div>
      <Title level={2} style={{ marginBottom: '24px' }}>
        🎯 实时监控中心
      </Title>
      <RealTimeMonitor />
    </div>
  );
};

export default MonitoringPage;
