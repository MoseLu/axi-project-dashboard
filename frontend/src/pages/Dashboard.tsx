import React, { useEffect, useState, useMemo } from 'react';
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Space,
  Button,
  Select,
  DatePicker,
  Badge,
  Progress,
  List,
  Avatar,
  Tag,
  Tooltip,
  Spin
} from 'antd';
import {
  RocketOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  FundOutlined,
  BugOutlined,
  TeamOutlined,
  ServerOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { useSocket } from '@/hooks/useSocket';
import { DeploymentChart } from '@/components/charts/DeploymentChart';
import { PerformanceChart } from '@/components/charts/PerformanceChart';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { ProjectCard } from '@/components/ProjectCard';
import { DeploymentStatusBadge } from '@/components/DeploymentStatusBadge';
import { RealTimeMetrics } from '@/components/RealTimeMetrics';
import { QuickActions } from '@/components/QuickActions';
import { AlertPanel } from '@/components/AlertPanel';
import {
  fetchDashboardData,
  fetchRecentDeployments,
  fetchSystemMetrics,
  selectDashboardData,
  selectRecentDeployments,
  selectSystemMetrics,
  selectDashboardLoading
} from '@/store/slices/dashboardSlice';
import {
  fetchProjects,
  selectProjects
} from '@/store/slices/projectSlice';
import { DeploymentStatus, Project, Deployment } from '@/types';
import { formatDuration, formatNumber, getStatusColor } from '@/utils/helpers';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

// 时间范围选项
const TIME_RANGE_OPTIONS = [
  { value: '1h', label: '过去1小时' },
  { value: '24h', label: '过去24小时' },
  { value: '7d', label: '过去7天' },
  { value: '30d', label: '过去30天' },
  { value: 'custom', label: '自定义' }
];

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const { emitEvent } = useSocket();
  
  // Redux state
  const dashboardData = useAppSelector(selectDashboardData);
  const recentDeployments = useAppSelector(selectRecentDeployments);
  const systemMetrics = useAppSelector(selectSystemMetrics);
  const projects = useAppSelector(selectProjects);
  const isLoading = useAppSelector(selectDashboardLoading);

  // Local state
  const [timeRange, setTimeRange] = useState('24h');
  const [customDateRange, setCustomDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProject, setSelectedProject] = useState<string>('all');

  // 计算统计数据
  const statistics = useMemo(() => {
    if (!dashboardData) return null;

    const { deployments, performance } = dashboardData;
    
    return {
      totalDeployments: deployments.totalDeployments,
      successRate: deployments.successRate,
      averageDuration: performance.averageDeploymentTime,
      activeProjects: projects.filter(p => p.isActive).length,
      failureRate: 100 - deployments.successRate,
      deploymentsToday: deployments.deploymentsToday
    };
  }, [dashboardData, projects]);

  // 过滤部署数据
  const filteredDeployments = useMemo(() => {
    if (!recentDeployments) return [];
    
    if (selectedProject === 'all') {
      return recentDeployments;
    }
    
    return recentDeployments.filter(d => d.projectId === selectedProject);
  }, [recentDeployments, selectedProject]);

  // 获取状态统计
  const statusStats = useMemo(() => {
    const stats = {
      [DeploymentStatus.SUCCESS]: 0,
      [DeploymentStatus.FAILURE]: 0,
      [DeploymentStatus.IN_PROGRESS]: 0,
      [DeploymentStatus.PENDING]: 0,
      [DeploymentStatus.CANCELLED]: 0
    };

    filteredDeployments.forEach(deployment => {
      stats[deployment.status]++;
    });

    return stats;
  }, [filteredDeployments]);

  // 初始化数据
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        dispatch(fetchDashboardData({ timeRange })),
        dispatch(fetchRecentDeployments({ limit: 50 })),
        dispatch(fetchSystemMetrics()),
        dispatch(fetchProjects())
      ]);
    };

    loadData();
  }, [dispatch, timeRange]);

  // 刷新数据
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        dispatch(fetchDashboardData({ timeRange })),
        dispatch(fetchRecentDeployments({ limit: 50 })),
        dispatch(fetchSystemMetrics())
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  // 处理时间范围变化
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
    if (value !== 'custom') {
      setCustomDateRange(null);
    }
  };

  // 处理自定义日期范围
  const handleCustomDateRangeChange = (dates: [dayjs.Dayjs, dayjs.Dayjs] | null) => {
    setCustomDateRange(dates);
    if (dates) {
      // 这里可以根据自定义时间范围重新获取数据
      dispatch(fetchDashboardData({ 
        startDate: dates[0].toISOString(),
        endDate: dates[1].toISOString()
      }));
    }
  };

  if (isLoading && !dashboardData) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>正在加载仪表板数据...</Text>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* 页面标题和操作 */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            <Space>
              <FundOutlined />
              部署仪表板
            </Space>
          </Title>
          <Text type="secondary">
            实时监控所有项目的部署状态和性能指标
          </Text>
        </Col>
        <Col>
          <Space>
            {/* 项目过滤器 */}
            <Select
              value={selectedProject}
              onChange={setSelectedProject}
              style={{ width: 200 }}
              placeholder="选择项目"
            >
              <Select.Option value="all">所有项目</Select.Option>
              {projects.map(project => (
                <Select.Option key={project.id} value={project.id}>
                  {project.displayName}
                </Select.Option>
              ))}
            </Select>

            {/* 时间范围选择器 */}
            <Select
              value={timeRange}
              onChange={handleTimeRangeChange}
              style={{ width: 150 }}
            >
              {TIME_RANGE_OPTIONS.map(option => (
                <Select.Option key={option.value} value={option.value}>
                  {option.label}
                </Select.Option>
              ))}
            </Select>

            {/* 自定义日期范围 */}
            {timeRange === 'custom' && (
              <RangePicker
                value={customDateRange}
                onChange={handleCustomDateRangeChange}
                format="YYYY-MM-DD"
              />
            )}

            {/* 刷新按钮 */}
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={refreshing}
            >
              刷新
            </Button>
          </Space>
        </Col>
      </Row>

      {/* 关键指标卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总部署次数"
              value={statistics?.totalDeployments || 0}
              prefix={<RocketOutlined />}
              formatter={(value) => formatNumber(value as number)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="成功率"
              value={statistics?.successRate || 0}
              precision={1}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: getStatusColor('success') }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="平均部署时间"
              value={statistics?.averageDuration || 0}
              formatter={(value) => formatDuration(value as number)}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="活跃项目"
              value={statistics?.activeProjects || 0}
              prefix={<ServerOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 实时指标和告警 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <RealTimeMetrics />
        </Col>
        <Col xs={24} lg={8}>
          <AlertPanel />
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} xl={12}>
          <Card title="部署趋势" extra={<TrophyOutlined />}>
            <DeploymentChart 
              data={dashboardData?.deployments.trendData || []}
              timeRange={timeRange}
            />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title="性能分析" extra={<FundOutlined />}>
            <PerformanceChart 
              data={dashboardData?.performance || null}
              timeRange={timeRange}
            />
          </Card>
        </Col>
      </Row>

      {/* 部署状态概览 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={8}>
          <Card title="部署状态分布">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>成功</Text>
                <Space>
                  <Badge color="green" />
                  <Text strong>{statusStats[DeploymentStatus.SUCCESS]}</Text>
                </Space>
              </div>
              <Progress 
                percent={(statusStats[DeploymentStatus.SUCCESS] / filteredDeployments.length) * 100}
                strokeColor="green"
                showInfo={false}
              />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>失败</Text>
                <Space>
                  <Badge color="red" />
                  <Text strong>{statusStats[DeploymentStatus.FAILURE]}</Text>
                </Space>
              </div>
              <Progress 
                percent={(statusStats[DeploymentStatus.FAILURE] / filteredDeployments.length) * 100}
                strokeColor="red"
                showInfo={false}
              />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text>进行中</Text>
                <Space>
                  <Badge color="blue" />
                  <Text strong>{statusStats[DeploymentStatus.IN_PROGRESS]}</Text>
                </Space>
              </div>
              <Progress 
                percent={(statusStats[DeploymentStatus.IN_PROGRESS] / filteredDeployments.length) * 100}
                strokeColor="blue"
                showInfo={false}
              />
            </Space>
          </Card>
        </Col>
        
        <Col xs={24} lg={16}>
          <Card 
            title="最近部署"
            extra={
              <Button 
                type="link" 
                onClick={() => window.location.href = '/deployments'}
              >
                查看全部
              </Button>
            }
          >
            <List
              dataSource={filteredDeployments.slice(0, 8)}
              renderItem={(deployment: Deployment) => (
                <List.Item
                  actions={[
                    <Button 
                      type="link" 
                      size="small"
                      onClick={() => window.location.href = `/deployments/${deployment.id}`}
                    >
                      查看详情
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        style={{ backgroundColor: getStatusColor(deployment.status) }}
                        icon={deployment.status === DeploymentStatus.SUCCESS ? <CheckCircleOutlined /> : 
                             deployment.status === DeploymentStatus.FAILURE ? <CloseCircleOutlined /> :
                             <ClockCircleOutlined />}
                      />
                    }
                    title={
                      <Space>
                        <Text strong>{deployment.projectId}</Text>
                        <DeploymentStatusBadge status={deployment.status} />
                      </Space>
                    }
                    description={
                      <Space>
                        <Text type="secondary">
                          {dayjs(deployment.startedAt).fromNow()}
                        </Text>
                        {deployment.duration && (
                          <Text type="secondary">
                            · 耗时 {formatDuration(deployment.duration)}
                          </Text>
                        )}
                        <Text type="secondary">
                          · 由 {deployment.triggerBy} 触发
                        </Text>
                      </Space>
                    }
                  />
                  <div>
                    <Tooltip title={deployment.gitCommit.message}>
                      <Tag color="geekblue">
                        {deployment.gitCommit.sha.substring(0, 7)}
                      </Tag>
                    </Tooltip>
                  </div>
                </List.Item>
              )}
              locale={{ emptyText: '暂无部署记录' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 快速操作和活动时间线 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <QuickActions />
        </Col>
        <Col xs={24} lg={16}>
          <ActivityTimeline />
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
