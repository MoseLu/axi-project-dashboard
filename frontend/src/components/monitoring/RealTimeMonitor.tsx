import React, { useEffect, useState } from 'react';
import { Card, Typography, Alert, Button, Space, Badge } from 'antd';
import { WifiOutlined, WifiOutlined as WifiOffOutlined, SyncOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useSocket } from '../../hooks/useSocket';

const { Title, Text } = Typography;

interface RealTimeMonitorProps {
  token?: string | null;
}

export const RealTimeMonitor: React.FC<RealTimeMonitorProps> = ({ token }) => {
  const { connected, lastEvent, connectionError, isConnecting, reconnect, connectionAttempts, maxAttempts, disabled } = useSocket(token);
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    if (lastEvent) {
      setEventCount(prev => prev + 1);
    }
  }, [lastEvent]);

  const getConnectionStatus = () => {
    if (disabled) {
      return {
        icon: <WifiOffOutlined />,
        text: '实时功能维护中',
        color: 'default',
        status: 'disabled'
      };
    }
    
    if (isConnecting) {
      return {
        icon: <SyncOutlined spin />,
        text: `连接中... (第${connectionAttempts}/${maxAttempts}次尝试)`,
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
      text: connectionAttempts > 0 ? `连接失败 (${connectionAttempts}/${maxAttempts}次尝试)` : '未连接',
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
                <Text type={status.color === 'error' ? 'danger' : 'secondary'}>
                  {status.text}
                </Text>
              </Space>
            }
          />
        </Space>
      }
      extra={
        !disabled && !connected && !isConnecting && (
          <Button 
            type="primary" 
            size="small" 
            icon={<SyncOutlined />}
            onClick={reconnect}
            loading={isConnecting}
            disabled={connectionAttempts >= maxAttempts}
          >
            {connectionAttempts >= maxAttempts ? '重置重连' : '重连'}
          </Button>
        )
      }
      style={{ marginBottom: 16 }}
    >
      {disabled && (
        <Alert
          message="实时功能维护中"
          description={
            <div>
              <p>WebSocket实时功能暂时不可用，正在进行服务器维护。</p>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                其他功能正常工作，预计维护时间：2-4小时
              </p>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {connectionError && !disabled && (
        <Alert
          message="WebSocket连接问题"
          description={
            <div>
              <p>{connectionError}</p>
              <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                实时功能暂时不可用，但其他功能正常工作。如果问题持续存在，请联系管理员。
              </p>
              {connectionAttempts > 0 && (
                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  已尝试连接 {connectionAttempts}/{maxAttempts} 次
                </p>
              )}
            </div>
          }
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: 16 }}
          action={
            <Button 
              size="small" 
              onClick={reconnect} 
              loading={isConnecting}
              disabled={connectionAttempts >= maxAttempts}
            >
              {connectionAttempts >= maxAttempts ? '重置重连' : '重试连接'}
            </Button>
          }
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Text strong>连接状态: </Text>
          <Text type={status.color === 'error' ? 'danger' : 'secondary'}>
            {status.text}
          </Text>
        </div>
        
        <div>
          <Text strong>事件计数: </Text>
          <Text>{eventCount}</Text>
        </div>
      </div>

      {lastEvent && !disabled && (
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

      {!connected && !connectionError && !disabled && (
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">
            WebSocket未连接，实时监控功能不可用。请检查网络连接或联系管理员。
          </Text>
        </div>
      )}

      {/* 添加调试信息 */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ marginTop: 16, padding: '8px', background: '#f0f0f0', borderRadius: '4px', fontSize: '12px' }}>
          <Text strong>调试信息:</Text>
          <div>WebSocket禁用: {disabled ? '是' : '否'}</div>
          <div>连接尝试次数: {connectionAttempts}/{maxAttempts}</div>
          <div>连接状态: {connected ? '已连接' : '未连接'}</div>
          <div>连接中: {isConnecting ? '是' : '否'}</div>
          <div>错误信息: {connectionError || '无'}</div>
        </div>
      )}
    </Card>
  );
};
