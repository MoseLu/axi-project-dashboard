import React, { useState, useEffect } from 'react';
import { Card, Typography, Table, Tag, Space, Button, DatePicker, Select, Progress, Row, Col, message, Spin } from 'antd';
import { 
  ReloadOutlined, 
  DownloadOutlined,
  FilterOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';

const { Text } = Typography;
const { RangePicker } = DatePicker;

interface DeploymentRecord {
  id: number;
  project_name: string;
  branch: string;
  status: 'success' | 'failed' | 'running' | 'pending';
  duration: number;
  triggered_by: string;
  created_at: string;
  commit_hash: string;
  progress: number;
}

const DeploymentHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState<DeploymentRecord[]>([]);
  const [filters, setFilters] = useState({
    project: '',
    status: '',
    dateRange: null as any
  });

  // 获取部署历史数据
  const fetchDeploymentHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/deployments/history');
      
      if (response.data.success) {
        setHistoryData(response.data.data || []);
      } else {
        message.error('获取部署历史失败');
        setHistoryData([]);
      }
    } catch (error) {
      console.error('获取部署历史失败:', error);
      message.error('获取部署历史失败');
      setHistoryData([]);
    } finally {
      setLoading(false);
    }
  };

  // 重新部署
  const handleRedeploy = async (record: DeploymentRecord) => {
    try {
      const response = await api.post(`/deployments/${record.id}/redeploy`);
      if (response.data.success) {
        message.success('重新部署已触发');
        fetchDeploymentHistory(); // 刷新数据
      } else {
        message.error('重新部署失败');
      }
    } catch (error) {
      console.error('重新部署失败:', error);
      message.error('重新部署失败');
    }
  };

  // 应用筛选
  const applyFilters = () => {
    // 这里可以实现筛选逻辑
    message.info('筛选功能开发中');
  };

  // 导出数据
  const exportData = () => {
    // 这里可以实现导出逻辑
    message.info('导出功能开发中');
  };

  useEffect(() => {
    fetchDeploymentHistory();
  }, []);

  // 计算统计数据
  const totalDeployments = historyData.length;
  const successfulDeployments = historyData.filter(item => item.status === 'success').length;
  const successRate = totalDeployments > 0 ? Math.round((successfulDeployments / totalDeployments) * 100) : 0;
  const averageDuration = totalDeployments > 0 ? Math.round(historyData.reduce((sum, item) => sum + item.duration, 0) / totalDeployments) : 0;

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'project_name',
      key: 'project_name',
      render: (text: string) => <Text strong className="content-text">{text}</Text>,
    },
    {
      title: '分支',
      dataIndex: 'branch',
      key: 'branch',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          success: { color: 'success', text: '成功' },
          failed: { color: 'error', text: '失败' },
          running: { color: 'processing', text: '进行中' },
          pending: { color: 'warning', text: '等待中' },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => (
        <Text className="content-text">{duration}s</Text>
      ),
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number, record: any) => (
        <div style={{ width: '100px' }}>
          <Progress 
            percent={progress} 
            size={[100, 8]}
            status={record.status === 'success' ? 'success' : record.status === 'failed' ? 'exception' : 'active'}
            strokeColor={{
              '0%': '#667eea',
              '100%': '#764ba2',
            }}
          />
        </div>
      ),
    },
    {
      title: '触发者',
      dataIndex: 'triggered_by',
      key: 'triggered_by',
      render: (text: string) => <Text className="content-text">{text || '系统'}</Text>,
    },
    {
      title: '部署时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text: string) => <Text className="content-text">{text}</Text>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small"
            onClick={() => navigate(`/deployments/history/${record.id}`)}
          >
            查看详情
          </Button>
          <Button 
            type="link" 
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => handleRedeploy(record)}
          >
            重新部署
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="content-area" style={{ 
      minHeight: '100vh',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{ position: 'relative', zIndex: 1 }}>
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass-card">
            <div style={{ textAlign: 'center' }}>
              <Text className="content-text-secondary">总部署次数</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--content-text)', marginTop: '8px' }}>
                {totalDeployments}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass-card">
            <div style={{ textAlign: 'center' }}>
              <Text className="content-text-secondary">成功率</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--content-text)', marginTop: '8px' }}>
                {successRate}%
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass-card">
            <div style={{ textAlign: 'center' }}>
              <Text className="content-text-secondary">平均耗时</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--content-text)', marginTop: '8px' }}>
                {averageDuration}s
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="glass-card">
            <div style={{ textAlign: 'center' }}>
              <Text className="content-text-secondary">成功率进度</Text>
              <Progress 
                percent={successRate} 
                size={[120, 8]}
                status={successRate >= 90 ? 'success' : successRate >= 70 ? 'normal' : 'active'}
                strokeColor={{
                  '0%': '#667eea',
                  '100%': '#764ba2',
                }}
                style={{ marginTop: '8px' }}
              />
            </div>
          </Card>
        </Col>
      </Row>

      {/* 筛选控制 */}
      <Card className="glass-card" style={{ marginBottom: '24px' }}>
        <Space size="large" wrap>
          <div>
            <Text strong style={{ marginRight: '8px' }}>项目筛选:</Text>
            <Select
              placeholder="选择项目"
              style={{ width: 200 }}
              allowClear
              value={filters.project}
              onChange={(value) => setFilters(prev => ({ ...prev, project: value }))}
            >
              <Select.Option value="axi-project-dashboard">axi-project-dashboard</Select.Option>
              <Select.Option value="axi-star-cloud">axi-star-cloud</Select.Option>
              <Select.Option value="axi-docs">axi-docs</Select.Option>
            </Select>
          </div>
          <div>
            <Text strong style={{ marginRight: '8px' }}>状态筛选:</Text>
            <Select
              placeholder="选择状态"
              style={{ width: 150 }}
              allowClear
              value={filters.status}
              onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <Select.Option value="success">成功</Select.Option>
              <Select.Option value="failed">失败</Select.Option>
              <Select.Option value="running">进行中</Select.Option>
              <Select.Option value="pending">等待中</Select.Option>
            </Select>
          </div>
          <div>
            <Text strong style={{ marginRight: '8px' }}>时间范围:</Text>
            <RangePicker 
              value={filters.dateRange}
              onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates }))}
            />
          </div>
          <Button type="primary" icon={<FilterOutlined />} onClick={applyFilters}>
            应用筛选
          </Button>
          <Button icon={<DownloadOutlined />} onClick={exportData}>
            导出数据
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchDeploymentHistory}>
            刷新数据
          </Button>
        </Space>
      </Card>

      {/* 历史记录表格 */}
      <Card className="glass-card">
        <Spin spinning={loading}>
          {historyData.length === 0 && !loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Text className="content-text-secondary">暂无部署历史数据</Text>
              <br />
              <Text className="content-text-secondary">当有部署发生时，数据将自动显示在这里</Text>
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={historyData}
              rowKey="id"
              pagination={{
                total: historyData.length,
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
              }}
              className="content-table"
            />
          )}
        </Spin>
      </Card>
      </div>
    </div>
  );
};

export default DeploymentHistoryPage;
