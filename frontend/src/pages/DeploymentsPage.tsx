import React, { useState } from 'react';
import { Card, Tag, Space, Button, Modal, Descriptions, Typography, message } from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  StopOutlined
} from '@ant-design/icons';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { useDashboardData } from '../hooks/useDashboardData';
import { getStatusText, formatTime, getDeploymentTime } from '../utils/dashboardUtils';
import { DeploymentDetail } from '../types/dashboard';

const { Text } = Typography;

const DeploymentsPage: React.FC = () => {
  const {
    deployments,
    loading,
    handleSort,
    handlePageChange,
    pagination
  } = useDashboardData();

  const [selectedDeployment, setSelectedDeployment] = useState<DeploymentDetail | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const handleViewDetails = (record: DeploymentDetail) => {
    setSelectedDeployment(record);
    setDetailModalVisible(true);
  };

  const handleRedeploy = (record: DeploymentDetail) => {
    message.success(`正在重新部署项目: ${record.project_name}`);
  };

  const handleStopDeployment = (record: DeploymentDetail) => {
    message.warning(`正在停止部署: ${record.project_name}`);
  };

  const columns: ProColumns<DeploymentDetail>[] = [
    {
      title: '项目名称',
      dataIndex: 'project_name',
      key: 'project_name',
      width: 200,
      ellipsis: true,
      align: 'left',
      render: (_, entity) => <Text strong className="content-text">{entity.project_name}</Text>,
      sorter: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      ellipsis: true,
      align: 'center',
      render: (_, entity) => {
        const statusConfig = {
          success: { color: 'success', icon: <CheckCircleOutlined /> },
          failed: { color: 'error', icon: <CloseCircleOutlined /> },
          running: { color: 'processing', icon: <ClockCircleOutlined /> },
          pending: { color: 'warning', icon: <ClockCircleOutlined /> },
        };
        const config = statusConfig[entity.status as keyof typeof statusConfig] || { color: 'default', icon: null };
        
        return (
          <Tag color={config.color} icon={config.icon}>
            {getStatusText(entity.status)}
          </Tag>
        );
      },
      filters: [
        { text: '成功', value: 'success' },
        { text: '失败', value: 'failed' },
        { text: '进行中', value: 'running' },
        { text: '等待中', value: 'pending' },
      ],
    },
    {
      title: '分支',
      dataIndex: 'branch',
      key: 'branch',
      width: 120,
      ellipsis: true,
      align: 'center',
      render: (_, entity) => <Tag color="blue">{entity.branch}</Tag>,
    },
    {
      title: '耗时',
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      ellipsis: true,
      align: 'center',
      render: (_, entity) => (
        <Text className="content-text">{entity.duration > 0 ? `${entity.duration}s` : '-'}</Text>
      ),
      sorter: true,
    },
    {
      title: '触发类型',
      dataIndex: 'trigger_type',
      key: 'trigger_type',
      width: 120,
      ellipsis: true,
      align: 'center',
      render: (_, entity) => {
        const typeConfig = {
          push: { color: 'green', text: '代码推送' },
          manual: { color: 'blue', text: '手动触发' },
          schedule: { color: 'orange', text: '定时任务' },
        };
        const config = typeConfig[entity.trigger_type as keyof typeof typeConfig] || { color: 'default', text: entity.trigger_type };
        
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '部署时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      ellipsis: true,
      align: 'center',
      render: (_, entity) => formatTime(getDeploymentTime(entity)),
      sorter: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      align: 'center',
      render: (_, entity) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(entity)}
            className="content-text"
          >
            查看详情
          </Button>
          {entity.status === 'failed' && (
            <Button 
              type="link" 
              size="small" 
              icon={<PlayCircleOutlined />}
              onClick={() => handleRedeploy(entity)}
              className="content-text"
            >
              重新部署
            </Button>
          )}
          {entity.status === 'running' && (
            <Button 
              type="link" 
              size="small" 
              icon={<StopOutlined />}
              danger
              onClick={() => handleStopDeployment(entity)}
            >
              停止部署
            </Button>
          )}
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
        <Card className="glass-card">
          <ProTable<DeploymentDetail>
            columns={columns}
            dataSource={deployments}
            loading={loading}
            rowKey="id"
            search={false}
            scroll={{ y: 400 }}
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
            }}
            onChange={(pagination, _, sorter) => {
              if (sorter && typeof sorter === 'object' && 'field' in sorter) {
                handleSort(sorter.field as string);
              }
              if (pagination && pagination.current) {
                handlePageChange(pagination.current);
              }
            }}
            className="content-table"
            style={{
              background: 'transparent'
            }}
          />
        </Card>
      </div>

      {/* 详情模态框 */}
      <Modal
        title="部署详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
        className="content-modal"
      >
        {selectedDeployment && (
          <Descriptions bordered column={2}>
            <Descriptions.Item label="项目名称" span={2}>
              <Text strong className="content-text">{selectedDeployment.project_name}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={selectedDeployment.status === 'success' ? 'success' : 'error'}>
                {getStatusText(selectedDeployment.status)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="分支">
              <Tag color="blue">{selectedDeployment.branch}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="耗时">
              <Text className="content-text">
                {selectedDeployment.duration > 0 ? `${selectedDeployment.duration}s` : '-'}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="触发类型">
              <Tag color="green">{selectedDeployment.trigger_type}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="部署时间" span={2}>
              <Text className="content-text">
                {formatTime(getDeploymentTime(selectedDeployment))}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="提交信息" span={2}>
              <Text className="content-text">{selectedDeployment.commit_hash || '无'}</Text>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default DeploymentsPage;
