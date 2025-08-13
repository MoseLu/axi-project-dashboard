import React from 'react';
import { Card, Typography, Table, Tag, Space, Button, DatePicker, Select, Progress, Row, Col } from 'antd';
import { 
  ReloadOutlined, 
  DownloadOutlined,
  FilterOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Text } = Typography;
const { RangePicker } = DatePicker;

const DeploymentHistoryPage: React.FC = () => {
  const navigate = useNavigate();

  // 模拟历史数据
  const historyData = [
    {
      id: 1,
      project_name: 'axi-project-dashboard',
      branch: 'main',
      status: 'success',
      duration: 45,
      triggered_by: '张三',
      created_at: '2024-01-15 14:30:00',
      commit_hash: 'a1b2c3d4',
      progress: 100
    },
    {
      id: 2,
      project_name: 'axi-star-cloud',
      branch: 'develop',
      status: 'failed',
      duration: 120,
      triggered_by: '李四',
      created_at: '2024-01-15 13:15:00',
      commit_hash: 'e5f6g7h8',
      progress: 65
    },
    {
      id: 3,
      project_name: 'axi-docs',
      branch: 'feature/new-docs',
      status: 'success',
      duration: 30,
      triggered_by: '王五',
      created_at: '2024-01-15 12:00:00',
      commit_hash: 'i9j0k1l2',
      progress: 100
    }
  ];

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
      render: (text: string) => <Text className="content-text">{text}</Text>,
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
            >
              <Select.Option value="success">成功</Select.Option>
              <Select.Option value="failed">失败</Select.Option>
              <Select.Option value="running">进行中</Select.Option>
              <Select.Option value="pending">等待中</Select.Option>
            </Select>
          </div>
          <div>
            <Text strong style={{ marginRight: '8px' }}>时间范围:</Text>
            <RangePicker />
          </div>
          <Button type="primary" icon={<FilterOutlined />}>
            应用筛选
          </Button>
          <Button icon={<DownloadOutlined />}>
            导出数据
          </Button>
        </Space>
      </Card>

      {/* 历史记录表格 */}
      <Card className="glass-card">
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
      </Card>
      </div>
    </div>
  );
};

export default DeploymentHistoryPage;
