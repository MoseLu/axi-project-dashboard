import React, { useEffect, useState } from 'react';
import { Card, Typography, Alert, Button, Space, Badge, Tooltip } from 'antd';
import { WifiOutlined, WifiOffOutlined, SyncOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useSocket } from '../../hooks/useSocket';

const { Title, Text } = Typography;

interface RealTimeMonitorProps {
  token?: string | null;
}

export const RealTimeMonitor: React.FC<RealTimeMonitorProps> = ({ token }) => {
  const { socket, connected, lastEvent, connectionError, isConnecting, reconnect } = useSocket(token);
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    if (lastEvent) {
      setEventCount(prev => prev + 1);
    }
  }, [lastEvent]);

  const getConnectionStatus = () => {
    if (isConnecting) {
      return {
        icon: <SyncOutlined spin />,
        text: '连接中...',
        color: 'processing',
        status: 'connecting'
      };
    }
    
    if (connected) {
      return {
        icon: <WifiOutlined />,
        text: '已连接',
        color: 'success',
        status: 'connected'
      };
    }
    
    return {
      icon: <WifiOffOutlined />,
      text: '未连接',
      color: 'error',
      status: 'disconnected'
    };
  };

  const status = getConnectionStatus();

  return (
    <Card 
      title={
        <Space>
          <Title level={4} style={{ margin: 0 }}>实时监控</Title>
          <Badge 
            status={status.color as any} 
            text={
              <Space>
                {status.icon}
                <Text type={status.color === 'error' ? 'danger' : undefined}>
                  {status.text}
                </Text>
              </Space>
            }
          />
        </Space>
      }
      extra={
        !connected && !isConnecting && (
          <Button 
            type="primary" 
            size="small" 
            icon={<SyncOutlined />}
            onClick={reconnect}
            loading={isConnecting}
          >
            重连
          </Button>
        )
      }
      style={{ marginBottom: 16 }}
    >
      {connectionError && (
        <Alert
          message="WebSocket连接问题"
          description={
            <div>
              <p>{connectionError}</p>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                实时功能暂时不可用，但其他功能正常工作。如果问题持续存在，请联系管理员。
              </p>
            </div>
          }
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: 16 }}
          action={
            <Button size="small" onClick={reconnect} loading={isConnecting}>
              重试连接
            </Button>
          }
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Text strong>连接状态: </Text>
          <Text type={status.color === 'error' ? 'danger' : undefined}>
            {status.text}
          </Text>
        </div>
        
        <div>
          <Text strong>事件计数: </Text>
          <Text>{eventCount}</Text>
        </div>
      </div>

      {lastEvent && (
        <div style={{ marginTop: 16 }}>
          <Text strong>最新事件: </Text>
          <div style={{ 
            background: '#f5f5f5', 
            padding: '8px', 
            borderRadius: '4px', 
            marginTop: '8px',
            fontSize: '12px'
          }}>
            <div><strong>类型:</strong> {lastEvent.type}</div>
            <div><strong>时间:</strong> {new Date(lastEvent.timestamp).toLocaleString()}</div>
            <div><strong>数据:</strong> {JSON.stringify(lastEvent.payload, null, 2)}</div>
          </div>
        </div>
      )}

      {!connected && !connectionError && (
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">
            WebSocket未连接，实时监控功能不可用。请检查网络连接或联系管理员。
          </Text>
        </div>
      )}
    </Card>
  );
};
