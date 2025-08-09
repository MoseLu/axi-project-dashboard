import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Card,
  Progress,
  Space,
  Typography,
  Badge,
  List,
  Avatar,
  Tooltip,
  Button,
  Tag,
  Divider,
  Steps,
  Alert,
  Drawer,
  Row,
  Col,
  Timeline,
  Empty,
  Spin
} from 'antd';
import {
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  ExpandOutlined,
  BugOutlined,
  RocketOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { FixedSizeList as List as VirtualList } from 'react-window';

import { useSocket } from '@/hooks/useSocket';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { 
  Deployment, 
  DeploymentStep, 
  StepStatus, 
  DeploymentStatus,
  SocketEventType,
  StepLog,
  LogLevel 
} from '@/types';
import { 
  selectActiveDeployments,
  updateDeployment,
  updateDeploymentStep,
  addStepLog
} from '@/store/slices/deploymentSlice';
import { formatDuration, getStatusColor, getStatusIcon } from '@/utils/helpers';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

interface DeploymentItemProps {
  deployment: Deployment;
  onViewDetails: (deployment: Deployment) => void;
}

interface StepItemProps {
  step: DeploymentStep;
  deploymentId: string;
  onViewLogs: (step: DeploymentStep) => void;
}

interface LogViewerProps {
  visible: boolean;
  step: DeploymentStep | null;
  deploymentId: string;
  onClose: () => void;
}

// 单个部署项组件
const DeploymentItem: React.FC<DeploymentItemProps> = ({ deployment, onViewDetails }) => {
  const progress = useMemo(() => {
    const totalSteps = deployment.steps.length;
    const completedSteps = deployment.steps.filter(
      step => step.status === StepStatus.SUCCESS || step.status === StepStatus.FAILURE
    ).length;
    
    return totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  }, [deployment.steps]);

  const currentStep = useMemo(() => {
    return deployment.steps.find(step => 
      step.status === StepStatus.IN_PROGRESS || step.status === StepStatus.RETRYING
    );
  }, [deployment.steps]);

  const duration = useMemo(() => {
    if (deployment.completedAt) {
      return deployment.duration || 0;
    }
    return Date.now() - new Date(deployment.startedAt).getTime();
  }, [deployment.startedAt, deployment.completedAt, deployment.duration]);

  const getStatusBadge = (status: DeploymentStatus) => {
    const statusConfig = {
      [DeploymentStatus.IN_PROGRESS]: { color: 'processing', icon: <SyncOutlined spin /> },
      [DeploymentStatus.SUCCESS]: { color: 'success', icon: <CheckCircleOutlined /> },
      [DeploymentStatus.FAILURE]: { color: 'error', icon: <CloseCircleOutlined /> },
      [DeploymentStatus.PENDING]: { color: 'default', icon: <ClockCircleOutlined /> },
      [DeploymentStatus.CANCELLED]: { color: 'warning', icon: <ExclamationCircleOutlined /> }
    };

    const config = statusConfig[status];
    return (
      <Badge 
        status={config.color as any} 
        text={
          <Space>
            {config.icon}
            {status.replace('_', ' ').toUpperCase()}
          </Space>
        } 
      />
    );
  };

  return (
    <Card 
      size="small" 
      style={{ marginBottom: 16 }}
      hoverable
      onClick={() => onViewDetails(deployment)}
      extra={
        <Space>
          <Text type="secondary">{formatDuration(duration)}</Text>
          <Button 
            type="link" 
            size="small" 
            icon={<ExpandOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(deployment);
            }}
          >
            详情
          </Button>
        </Space>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* 项目信息 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Avatar 
              size="small" 
              style={{ backgroundColor: getStatusColor(deployment.status) }}
              icon={getStatusIcon(deployment.status)}
            />
            <Text strong>{deployment.projectId}</Text>
            <Tag color="blue">{deployment.environmentId}</Tag>
          </Space>
          {getStatusBadge(deployment.status)}
        </div>

        {/* 提交信息 */}
        <div>
          <Text type="secondary">
            {deployment.gitCommit.message.substring(0, 50)}
            {deployment.gitCommit.message.length > 50 ? '...' : ''}
          </Text>
          <br />
          <Space>
            <Tag color="geekblue">{deployment.gitCommit.sha.substring(0, 8)}</Tag>
            <Text type="secondary">by {deployment.gitCommit.author.name}</Text>
            <Text type="secondary">· {dayjs(deployment.startedAt).fromNow()}</Text>
          </Space>
        </div>

        {/* 当前步骤 */}
        {currentStep && (
          <Alert
            message={`正在执行: ${currentStep.displayName}`}
            type="info"
            showIcon
            icon={<SyncOutlined spin />}
            style={{ marginTop: 8 }}
          />
        )}

        {/* 进度条 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text type="secondary">部署进度</Text>
            <Text type="secondary">
              {deployment.steps.filter(s => s.status === StepStatus.SUCCESS).length} / {deployment.steps.length}
            </Text>
          </div>
          <Progress 
            percent={progress} 
            strokeColor={getStatusColor(deployment.status)}
            showInfo={false}
            size="small"
          />
        </div>
      </Space>
    </Card>
  );
};

// 步骤项组件
const StepItem: React.FC<StepItemProps> = ({ step, deploymentId, onViewLogs }) => {
  const getStepIcon = (status: StepStatus) => {
    switch (status) {
      case StepStatus.SUCCESS:
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case StepStatus.FAILURE:
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case StepStatus.IN_PROGRESS:
        return <SyncOutlined spin style={{ color: '#1890ff' }} />;
      case StepStatus.RETRYING:
        return <ReloadOutlined spin style={{ color: '#faad14' }} />;
      case StepStatus.PENDING:
        return <ClockCircleOutlined style={{ color: '#d9d9d9' }} />;
      default:
        return <InfoCircleOutlined style={{ color: '#d9d9d9' }} />;
    }
  };

  const duration = useMemo(() => {
    if (step.completedAt && step.startedAt) {
      return new Date(step.completedAt).getTime() - new Date(step.startedAt).getTime();
    }
    if (step.startedAt && step.status === StepStatus.IN_PROGRESS) {
      return Date.now() - new Date(step.startedAt).getTime();
    }
    return 0;
  }, [step.startedAt, step.completedAt, step.status]);

  return (
    <div 
      style={{ 
        padding: '12px 16px', 
        borderBottom: '1px solid #f0f0f0',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
      }}
      onClick={() => onViewLogs(step)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          {getStepIcon(step.status)}
          <Text strong>{step.displayName}</Text>
          {step.retryAttempts.length > 0 && (
            <Tag color="orange">重试 {step.retryAttempts.length} 次</Tag>
          )}
        </Space>
        <Space>
          {duration > 0 && (
            <Text type="secondary">{formatDuration(duration)}</Text>
          )}
          <Badge status={step.status === StepStatus.SUCCESS ? 'success' : 
                        step.status === StepStatus.FAILURE ? 'error' : 
                        step.status === StepStatus.IN_PROGRESS ? 'processing' : 'default'} 
          />
        </Space>
      </div>
      
      {step.status === StepStatus.FAILURE && step.logs.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <Text type="danger" style={{ fontSize: '12px' }}>
            {step.logs.filter(log => log.level === LogLevel.ERROR)[0]?.message.substring(0, 100)}...
          </Text>
        </div>
      )}
    </div>
  );
};

// 日志查看器组件
const LogViewer: React.FC<LogViewerProps> = ({ visible, step, deploymentId, onClose }) => {
  const [autoScroll, setAutoScroll] = useState(true);
  const logs = step?.logs || [];

  const getLogColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.ERROR:
        return '#ff4d4f';
      case LogLevel.WARN:
        return '#faad14';
      case LogLevel.INFO:
        return '#1890ff';
      case LogLevel.DEBUG:
        return '#52c41a';
      default:
        return '#666666';
    }
  };

  const LogItem = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const log = logs[index];
    return (
      <div style={{ ...style, padding: '4px 16px', fontFamily: 'monospace', fontSize: '12px' }}>
        <span style={{ color: '#999' }}>
          {dayjs(log.timestamp).format('HH:mm:ss.SSS')}
        </span>
        <span style={{ color: getLogColor(log.level), marginLeft: 8, marginRight: 8 }}>
          [{log.level.toUpperCase()}]
        </span>
        <span>{log.message}</span>
      </div>
    );
  };

  return (
    <Drawer
      title={
        <Space>
          <BugOutlined />
          步骤日志: {step?.displayName}
        </Space>
      }
      placement="right"
      size="large"
      open={visible}
      onClose={onClose}
      extra={
        <Space>
          <Button
            type={autoScroll ? 'primary' : 'default'}
            size="small"
            onClick={() => setAutoScroll(!autoScroll)}
          >
            自动滚动
          </Button>
          <Button 
            size="small" 
            onClick={onClose}
          >
            关闭
          </Button>
        </Space>
      }
    >
      {step && (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* 步骤信息 */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Paragraph>
                  <Text strong>状态: </Text>
                  <Badge 
                    status={step.status === StepStatus.SUCCESS ? 'success' : 
                           step.status === StepStatus.FAILURE ? 'error' : 
                           step.status === StepStatus.IN_PROGRESS ? 'processing' : 'default'} 
                    text={step.status.toUpperCase()}
                  />
                </Paragraph>
                <Paragraph>
                  <Text strong>开始时间: </Text>
                  {step.startedAt ? dayjs(step.startedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
                </Paragraph>
              </Col>
              <Col span={12}>
                <Paragraph>
                  <Text strong>耗时: </Text>
                  {step.duration ? formatDuration(step.duration) : '-'}
                </Paragraph>
                <Paragraph>
                  <Text strong>重试次数: </Text>
                  {step.retryAttempts.length}
                </Paragraph>
              </Col>
            </Row>
          </Card>

          {/* 日志内容 */}
          <Card 
            title={`日志 (${logs.length} 条)`}
            size="small" 
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1, padding: 0, backgroundColor: '#001529' }}
          >
            {logs.length > 0 ? (
              <VirtualList
                height={400}
                itemCount={logs.length}
                itemSize={24}
                itemData={logs}
              >
                {LogItem}
              </VirtualList>
            ) : (
              <Empty 
                description="暂无日志" 
                style={{ margin: '50px 0' }}
              />
            )}
          </Card>
        </div>
      )}
    </Drawer>
  );
};

// 主监控组件
const RealTimeDeploymentMonitor: React.FC = () => {
  const dispatch = useAppDispatch();
  const { socket, isConnected } = useSocket();
  const activeDeployments = useAppSelector(selectActiveDeployments);
  
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);
  const [selectedStep, setSelectedStep] = useState<DeploymentStep | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [logsVisible, setLogsVisible] = useState(false);

  // 监听 Socket 事件
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleDeploymentEvent = (event: any) => {
      switch (event.type) {
        case SocketEventType.DEPLOYMENT_STARTED:
        case SocketEventType.DEPLOYMENT_UPDATED:
        case SocketEventType.DEPLOYMENT_COMPLETED:
        case SocketEventType.DEPLOYMENT_FAILED:
          dispatch(updateDeployment(event.payload));
          break;
        
        case SocketEventType.STEP_STARTED:
        case SocketEventType.STEP_UPDATED:
        case SocketEventType.STEP_COMPLETED:
        case SocketEventType.STEP_FAILED:
        case SocketEventType.STEP_RETRYING:
          dispatch(updateDeploymentStep({
            deploymentId: event.deploymentId,
            step: event.payload
          }));
          break;
        
        case SocketEventType.LOG_ENTRY:
          dispatch(addStepLog({
            deploymentId: event.deploymentId,
            stepId: event.payload.stepId,
            log: event.payload
          }));
          break;
      }
    };

    socket.on('event', handleDeploymentEvent);

    return () => {
      socket.off('event', handleDeploymentEvent);
    };
  }, [socket, isConnected, dispatch]);

  // 处理查看详情
  const handleViewDetails = useCallback((deployment: Deployment) => {
    setSelectedDeployment(deployment);
    setDetailsVisible(true);
  }, []);

  // 处理查看日志
  const handleViewLogs = useCallback((step: DeploymentStep) => {
    setSelectedStep(step);
    setLogsVisible(true);
  }, []);

  return (
    <div>
      <Card 
        title={
          <Space>
            <RocketOutlined />
            实时部署监控
            {!isConnected && (
              <Badge status="error" text="连接断开" />
            )}
            {isConnected && (
              <Badge status="success" text="实时连接" />
            )}
          </Space>
        }
        extra={
          <Text type="secondary">
            活跃部署: {activeDeployments.length}
          </Text>
        }
      >
        {activeDeployments.length === 0 ? (
          <Empty 
            description="暂无活跃部署"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={activeDeployments}
            renderItem={(deployment) => (
              <DeploymentItem
                key={deployment.id}
                deployment={deployment}
                onViewDetails={handleViewDetails}
              />
            )}
          />
        )}
      </Card>

      {/* 部署详情抽屉 */}
      <Drawer
        title={
          <Space>
            <RocketOutlined />
            部署详情: {selectedDeployment?.projectId}
          </Space>
        }
        placement="right"
        size="large"
        open={detailsVisible}
        onClose={() => setDetailsVisible(false)}
      >
        {selectedDeployment && (
          <div>
            {/* 基本信息 */}
            <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Paragraph>
                    <Text strong>项目: </Text>{selectedDeployment.projectId}
                  </Paragraph>
                  <Paragraph>
                    <Text strong>环境: </Text>
                    <Tag color="blue">{selectedDeployment.environmentId}</Tag>
                  </Paragraph>
                  <Paragraph>
                    <Text strong>状态: </Text>
                    <Badge 
                      status={selectedDeployment.status === DeploymentStatus.SUCCESS ? 'success' : 
                             selectedDeployment.status === DeploymentStatus.FAILURE ? 'error' : 
                             selectedDeployment.status === DeploymentStatus.IN_PROGRESS ? 'processing' : 'default'} 
                      text={selectedDeployment.status.toUpperCase()}
                    />
                  </Paragraph>
                </Col>
                <Col span={12}>
                  <Paragraph>
                    <Text strong>开始时间: </Text>
                    {dayjs(selectedDeployment.startedAt).format('YYYY-MM-DD HH:mm:ss')}
                  </Paragraph>
                  <Paragraph>
                    <Text strong>触发者: </Text>{selectedDeployment.triggerBy}
                  </Paragraph>
                  <Paragraph>
                    <Text strong>提交: </Text>
                    <Tag color="geekblue">{selectedDeployment.gitCommit.sha.substring(0, 8)}</Tag>
                  </Paragraph>
                </Col>
              </Row>
            </Card>

            {/* 步骤列表 */}
            <Card title="部署步骤" size="small">
              <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                {selectedDeployment.steps.map(step => (
                  <StepItem
                    key={step.id}
                    step={step}
                    deploymentId={selectedDeployment.id}
                    onViewLogs={handleViewLogs}
                  />
                ))}
              </div>
            </Card>
          </div>
        )}
      </Drawer>

      {/* 日志查看器 */}
      <LogViewer
        visible={logsVisible}
        step={selectedStep}
        deploymentId={selectedDeployment?.id || ''}
        onClose={() => setLogsVisible(false)}
      />
    </div>
  );
};

export default RealTimeDeploymentMonitor;
