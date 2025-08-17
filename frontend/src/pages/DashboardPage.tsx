import React from 'react';
import { Row, Col, Card, Statistic, Progress, Table, Tag, Space, Button, Typography } from 'antd';
import { 
  ArrowUpOutlined, 
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  MonitorOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../hooks/useDashboardData';
import { getStatusText } from '../utils/dashboardUtils';

const { Title, Text } = Typography;

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    deployments,
    metrics,
    loading
  } = useDashboardData();

  const successRate = metrics.totalDeployments > 0 
    ? Math.round((metrics.successfulDeployments / metrics.totalDeployments) * 100) 
    : 100;

  const recentDeployments = Array.isArray(deployments) ? deployments.slice(0, 5) : [];

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'project_name',
      key: 'project_name',
      render: (text: string) => <Text strong className="content-text">{text}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          success: { color: 'success', icon: <CheckCircleOutlined /> },
          failed: { color: 'error', icon: <CloseCircleOutlined /> },
          running: { color: 'processing', icon: <ClockCircleOutlined /> },
          pending: { color: 'warning', icon: <ClockCircleOutlined /> },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', icon: null };
        
        return (
          <Tag color={config.color} icon={config.icon}>
            {getStatusText(status)}
          </Tag>
        );
      },
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => (
        <Text className="content-text">{duration > 0 ? `${duration}s` : '-'}</Text>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space size="middle">
          <Button type="link" size="small" className="content-text">查看详情</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="content-area" style={{ 
      minHeight: '100vh',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* 统计卡片 */}
        <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="glass-card" style={{
              minHeight: '120px',
              overflow: 'hidden'
            }}>
              <Statistic
                title={<span className="content-text-secondary">总部署次数</span>}
                value={metrics.totalDeployments}
                prefix={<ArrowUpOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a', fontSize: '32px', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="glass-card" style={{
              minHeight: '120px',
              overflow: 'hidden'
            }}>
              <Statistic
                title={<span className="content-text-secondary">成功部署</span>}
                value={metrics.successfulDeployments}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a', fontSize: '32px', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="glass-card" style={{
              minHeight: '120px',
              overflow: 'hidden'
            }}>
              <Statistic
                title={<span className="content-text-secondary">失败部署</span>}
                value={metrics.failedDeployments}
                prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                valueStyle={{ color: '#ff4d4f', fontSize: '32px', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="glass-card" style={{
              minHeight: '120px',
              overflow: 'hidden',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/monitoring')}
            >
              <Statistic
                title={<span className="content-text-secondary">监控中心</span>}
                value="实时"
                prefix={<MonitorOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: '#722ed1', fontSize: '32px', fontWeight: 'bold' }}
              />
              <div style={{ 
                fontSize: '12px', 
                color: '#722ed1', 
                marginTop: '8px',
                textAlign: 'center'
              }}>
                点击查看实时监控
              </div>
            </Card>
          </Col>
        </Row>

        {/* 成功率进度条 */}
        <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
          <Col span={24}>
            <Card className="glass-card" style={{
              overflow: 'hidden'
            }}>
              <div style={{ marginBottom: 16 }}>
                <Title level={3} className="content-title" style={{ margin: 0 }}>
                  部署成功率
                </Title>
              </div>
              <Progress
                percent={successRate}
                status={successRate >= 90 ? 'success' : successRate >= 70 ? 'normal' : 'exception'}
                strokeColor={{
                  '0%': '#667eea',
                  '100%': '#764ba2',
                }}
                size={[12, 12]}
                trailColor="rgba(255,255,255,0.2)"
                style={{ marginBottom: 16, width: '100%' }}
                className="content-progress"
              />
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                fontSize: '14px'
              }}>
                <span className="content-text-secondary">成功: {metrics.successfulDeployments}</span>
                <span className="content-text-secondary">失败: {metrics.failedDeployments}</span>
                <span className="content-text-secondary">总计: {metrics.totalDeployments}</span>
                <span className="content-text-secondary">成功率: {successRate}%</span>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 最近部署记录 */}
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card className="glass-card" style={{
              overflow: 'hidden'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 16
              }}>
                <Title level={3} className="content-title" style={{ margin: 0 }}>
                  最近部署记录
                </Title>
                <Button 
                  type="primary" 
                  icon={<ReloadOutlined />} 
                  size="small"
                  className="content-button"
                >
                  刷新
                </Button>
              </div>
              <div className="content-table" style={{ minHeight: '200px' }}>
                <Table
                  columns={columns}
                  dataSource={recentDeployments}
                  rowKey="id"
                  pagination={false}
                  loading={loading}
                  size="small"
                  style={{
                    background: 'transparent'
                  }}
                />
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default DashboardPage;
