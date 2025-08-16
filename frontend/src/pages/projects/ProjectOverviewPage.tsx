import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Progress, 
  Tag, 
  Button, 
  Space, 
  Tooltip, 
  Modal, 
  message,
  Spin,
  Empty,
  Typography
} from 'antd';
import { 
  PlayCircleOutlined, 
  StopOutlined, 
  ReloadOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  MonitorOutlined,
  SettingOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { api } from '../../utils/api';

const { Title, Text } = Typography;

interface ProjectData {
  id: number;
  uuid: string;
  name: string;
  display_name: string;
  description?: string;
  repository: string;
  branch: string;
  deploy_type: 'static' | 'backend';
  status: 'active' | 'inactive' | 'maintenance';
  
  // 运行状态
  is_running: boolean;
  port?: number;
  url?: string;
  memory_usage?: number;
  disk_usage?: number;
  cpu_usage?: number;
  uptime?: number;
  last_health_check?: string;
  
  // 数据库状态
  has_mysql: boolean;
  mysql_status?: 'running' | 'stopped' | 'error';
  mysql_backup_enabled: boolean;
  mysql_backup_last?: string;
  
  has_redis: boolean;
  redis_status?: 'running' | 'stopped' | 'error';
  
  // 统计信息
  total_deployments: number;
  successful_deployments: number;
  failed_deployments: number;
  last_deployment?: string;
  average_deployment_time: number;
  
  created_at: string;
  updated_at: string;
}

const ProjectOverviewPage: React.FC = () => {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // 获取项目概览数据
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/projects/overview');
      if (response.success) {
        setProjects(response.data);
      } else {
        message.error('获取项目数据失败');
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      message.error('获取项目数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 刷新项目状态
  const refreshProjectStatus = async (projectName: string) => {
    try {
      setActionLoading(projectName);
      await api.post(`/projects/${projectName}/status/refresh`);
      message.success('项目状态已刷新');
      fetchProjects(); // 重新获取数据
    } catch (error) {
      console.error('Failed to refresh project status:', error);
      message.error('刷新项目状态失败');
    } finally {
      setActionLoading(null);
    }
  };

  // 启动项目
  const startProject = async (projectName: string) => {
    try {
      setActionLoading(projectName);
      await api.post(`/projects/${projectName}/start`);
      message.success('项目启动成功');
      fetchProjects();
    } catch (error) {
      console.error('Failed to start project:', error);
      message.error('项目启动失败');
    } finally {
      setActionLoading(null);
    }
  };

  // 停止项目
  const stopProject = async (projectName: string) => {
    try {
      setActionLoading(projectName);
      await api.post(`/projects/${projectName}/stop`);
      message.success('项目停止成功');
      fetchProjects();
    } catch (error) {
      console.error('Failed to stop project:', error);
      message.error('项目停止失败');
    } finally {
      setActionLoading(null);
    }
  };

  // 重启项目
  const restartProject = async (projectName: string) => {
    try {
      setActionLoading(projectName);
      await api.post(`/projects/${projectName}/restart`);
      message.success('项目重启成功');
      fetchProjects();
    } catch (error) {
      console.error('Failed to restart project:', error);
      message.error('项目重启失败');
    } finally {
      setActionLoading(null);
    }
  };

  // 获取状态标签
  const getStatusTag = (project: ProjectData) => {
    if (project.status === 'maintenance') {
      return <Tag color="orange" icon={<ExclamationCircleOutlined />}>维护中</Tag>;
    }
    if (project.status === 'inactive') {
      return <Tag color="default" icon={<CloseCircleOutlined />}>已停用</Tag>;
    }
    if (project.is_running) {
      return <Tag color="green" icon={<CheckCircleOutlined />}>运行中</Tag>;
    } else {
      return <Tag color="red" icon={<CloseCircleOutlined />}>已停止</Tag>;
    }
  };

  // 获取部署类型标签
  const getDeployTypeTag = (deployType: string) => {
    if (deployType === 'backend') {
      return <Tag color="blue" icon={<CloudServerOutlined />}>后端服务</Tag>;
    } else {
      return <Tag color="purple" icon={<DatabaseOutlined />}>静态网站</Tag>;
    }
  };

  // 格式化时间
  const formatTime = (seconds: number) => {
    if (!seconds) return '0秒';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}小时${minutes}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟${secs}秒`;
    } else {
      return `${secs}秒`;
    }
  };

  // 格式化内存使用量
  const formatMemory = (mb: number) => {
    if (!mb) return '0 MB';
    if (mb >= 1024) {
      return `${(mb / 1024).toFixed(1)} GB`;
    }
    return `${mb} MB`;
  };

  // 获取数据库状态图标
  const getDatabaseStatusIcon = (status?: string) => {
    switch (status) {
      case 'running':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'stopped':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      default:
        return <CloseCircleOutlined style={{ color: '#d9d9d9' }} />;
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '20px' }}>加载项目数据中...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2} style={{ margin: 0 }}>
          <MonitorOutlined /> 项目概览
        </Title>
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => {
              setRefreshing(true);
              fetchProjects().finally(() => setRefreshing(false));
            }}
            loading={refreshing}
          >
            刷新
          </Button>
        </Space>
      </div>

      {projects.length === 0 ? (
        <Empty 
          description="暂无项目数据" 
          style={{ marginTop: '100px' }}
        />
      ) : (
        <Row gutter={[16, 16]}>
          {projects.map((project) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={project.uuid}>
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{project.display_name}</span>
                    {getStatusTag(project)}
                  </div>
                }
                extra={
                  <Space>
                    {getDeployTypeTag(project.deploy_type)}
                  </Space>
                }
                actions={[
                  <Tooltip title="刷新状态">
                    <Button
                      type="text"
                      icon={<ReloadOutlined />}
                      loading={actionLoading === project.name}
                      onClick={() => refreshProjectStatus(project.name)}
                    />
                  </Tooltip>,
                  <Tooltip title={project.is_running ? "停止项目" : "启动项目"}>
                    <Button
                      type="text"
                      icon={project.is_running ? <StopOutlined /> : <PlayCircleOutlined />}
                      loading={actionLoading === project.name}
                      onClick={() => project.is_running ? stopProject(project.name) : startProject(project.name)}
                    />
                  </Tooltip>,
                  <Tooltip title="重启项目">
                    <Button
                      type="text"
                      icon={<ReloadOutlined />}
                      loading={actionLoading === project.name}
                      onClick={() => restartProject(project.name)}
                    />
                  </Tooltip>,
                  <Tooltip title="查看详情">
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={() => window.open(`/projects/${project.name}`, '_blank')}
                    />
                  </Tooltip>
                ]}
              >
                <div style={{ marginBottom: '16px' }}>
                  <Text type="secondary">{project.description || '暂无描述'}</Text>
                </div>

                {/* 运行状态 */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <Text strong>运行状态</Text>
                    <Text type="secondary">
                      {project.is_running ? '运行中' : '已停止'}
                    </Text>
                  </div>
                  
                  {project.is_running && (
                    <>
                      {project.port && (
                        <div style={{ marginBottom: '4px' }}>
                          <Text type="secondary">端口: </Text>
                          <Text code>{project.port}</Text>
                        </div>
                      )}
                      {project.url && (
                        <div style={{ marginBottom: '4px' }}>
                          <Text type="secondary">URL: </Text>
                          <Text code>{project.url}</Text>
                        </div>
                      )}
                      {project.uptime && (
                        <div style={{ marginBottom: '4px' }}>
                          <Text type="secondary">运行时间: </Text>
                          <Text>{formatTime(project.uptime)}</Text>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* 资源使用情况 */}
                {project.is_running && (project.memory_usage || project.cpu_usage) && (
                  <div style={{ marginBottom: '16px' }}>
                    <Text strong>资源使用</Text>
                    <div style={{ marginTop: '8px' }}>
                      {project.memory_usage && (
                        <div style={{ marginBottom: '4px' }}>
                          <Text type="secondary">内存: </Text>
                          <Text>{formatMemory(project.memory_usage)}</Text>
                        </div>
                      )}
                      {project.cpu_usage && (
                        <div style={{ marginBottom: '4px' }}>
                          <Text type="secondary">CPU: </Text>
                          <Text>{project.cpu_usage.toFixed(1)}%</Text>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 数据库状态 */}
                {(project.has_mysql || project.has_redis) && (
                  <div style={{ marginBottom: '16px' }}>
                    <Text strong>数据库状态</Text>
                    <div style={{ marginTop: '8px' }}>
                      {project.has_mysql && (
                        <div style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Text type="secondary">MySQL:</Text>
                          {getDatabaseStatusIcon(project.mysql_status)}
                          {project.mysql_backup_enabled && (
                            <Tag size="small" color="green">备份已启用</Tag>
                          )}
                        </div>
                      )}
                      {project.has_redis && (
                        <div style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Text type="secondary">Redis:</Text>
                          {getDatabaseStatusIcon(project.redis_status)}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 部署统计 */}
                <div style={{ marginBottom: '16px' }}>
                  <Text strong>部署统计</Text>
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ marginBottom: '4px' }}>
                      <Text type="secondary">总部署: </Text>
                      <Text>{project.total_deployments}</Text>
                    </div>
                    <div style={{ marginBottom: '4px' }}>
                      <Text type="secondary">成功率: </Text>
                      <Text>
                        {project.total_deployments > 0 
                          ? `${Math.round((project.successful_deployments / project.total_deployments) * 100)}%`
                          : '0%'
                        }
                      </Text>
                    </div>
                    {project.average_deployment_time > 0 && (
                      <div style={{ marginBottom: '4px' }}>
                        <Text type="secondary">平均部署时间: </Text>
                        <Text>{formatTime(project.average_deployment_time)}</Text>
                      </div>
                    )}
                  </div>
                </div>

                {/* 最后健康检查时间 */}
                {project.last_health_check && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ClockCircleOutlined />
                      <Text type="secondary">最后检查: </Text>
                      <Text>{new Date(project.last_health_check).toLocaleString()}</Text>
                    </div>
                  </div>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};

export default ProjectOverviewPage;
