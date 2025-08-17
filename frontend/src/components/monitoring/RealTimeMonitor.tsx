import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Tag, Button, Spin, Steps, Progress, Timeline } from 'antd';
import { ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { api } from '../../utils/api';

const { Step } = Steps;

const RealTimeMonitor: React.FC = () => {
  const [projects, setProjects] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [projectsResponse, deploymentsResponse] = await Promise.all([
        api.get('/monitoring/projects/status'),
        api.get('/deployments/recent')
      ]);
      
      if (projectsResponse.success) {
        setProjects(projectsResponse.data);
      }
      
      if (deploymentsResponse.success) {
        setDeployments(deploymentsResponse.data);
      }
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'failed':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'running':
        return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
      default:
        return <ClockCircleOutlined style={{ color: '#d9d9d9' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'failed':
        return 'error';
      case 'running':
        return 'processing';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>加载监控数据中...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', textAlign: 'right' }}>
        <Button
          type="primary"
          icon={<ReloadOutlined spin={refreshing} />}
          onClick={handleRefresh}
          loading={refreshing}
        >
          刷新数据
        </Button>
      </div>

      {/* 项目状态概览 */}
      <Card title="项目运行状态" style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          {projects.map((project: any) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={project.id}>
              <Card
                title={project.display_name}
                extra={
                  <Tag color={project.is_running ? 'success' : 'error'}>
                    {project.is_running ? '运行中' : '已停止'}
                  </Tag>
                }
                size="small"
              >
                <div style={{ marginBottom: '8px' }}>
                  <strong>项目:</strong> {project.name}
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <strong>类型:</strong> {project.deploy_type === 'backend' ? '后端' : '静态'}
                </div>
                {project.port && (
                  <div style={{ marginBottom: '8px' }}>
                    <strong>端口:</strong> {project.port}
                  </div>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 最近部署记录 */}
      <Card title="最近部署记录">
        {deployments.map((deployment: any) => (
          <Card
            key={deployment.id}
            size="small"
            style={{ marginBottom: '16px' }}
            title={
              <div>
                <span>{deployment.project_name}</span>
                <Tag color={getStatusColor(deployment.status)} style={{ marginLeft: '8px' }}>
                  {deployment.status}
                </Tag>
              </div>
            }
            extra={
              <span style={{ fontSize: '12px', color: '#666' }}>
                {new Date(deployment.created_at).toLocaleString()}
              </span>
            }
          >
            <div style={{ marginBottom: '12px' }}>
              <strong>仓库:</strong> {deployment.repository}
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>分支:</strong> {deployment.branch}
            </div>
            {deployment.duration > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <strong>耗时:</strong> {deployment.duration}秒
              </div>
            )}
            
            {/* 部署步骤 */}
            {deployment.steps && deployment.steps.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <strong>部署步骤:</strong>
                <Steps size="small" style={{ marginTop: '8px' }}>
                  {deployment.steps.map((step: any, index: number) => (
                    <Step
                      key={step.id}
                      title={step.display_name}
                      status={step.status}
                      icon={getStatusIcon(step.status)}
                      description={
                        <div>
                          <div>{step.status}</div>
                          {step.duration > 0 && (
                            <div style={{ fontSize: '11px', color: '#666' }}>
                              {step.duration}s
                            </div>
                          )}
                        </div>
                      }
                    />
                  ))}
                </Steps>
              </div>
            )}
          </Card>
        ))}

        {deployments.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
            暂无部署记录
          </div>
        )}
      </Card>
    </div>
  );
};

export default RealTimeMonitor;
