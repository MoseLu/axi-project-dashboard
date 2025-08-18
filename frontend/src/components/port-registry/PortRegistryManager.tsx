import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Modal, Form, Input, Select, Tag, Space, message, Popconfirm, Tooltip } from 'antd';
import { ReloadOutlined, PlusOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import { api } from '../../utils/api';

const { Option } = Select;

interface PortRegistration {
  projectId: string;
  projectName: string;
  port: number;
  status: 'allocated' | 'in-use' | 'released';
  allocatedAt: string;
  lastUsedAt?: string;
  deploymentId?: string;
  metadata?: {
    branch?: string;
    commit?: string;
    environment?: string;
    [key: string]: any;
  };
}

interface PortAllocationRequest {
  projectId: string;
  projectName: string;
  preferredPort?: number;
  deploymentId?: string;
  metadata?: {
    branch?: string;
    commit?: string;
    environment?: string;
    [key: string]: any;
  };
}

const PortRegistryManager: React.FC = () => {
  const [registrations, setRegistrations] = useState<PortRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [selectedRegistration, setSelectedRegistration] = useState<PortRegistration | null>(null);

  // 获取所有端口注册信息
  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/port-registry/all');
      if (response.success) {
        setRegistrations(response.data);
      } else {
        message.error('获取端口注册信息失败');
      }
    } catch (error) {
      console.error('Failed to fetch port registrations:', error);
      message.error('获取端口注册信息失败');
    } finally {
      setLoading(false);
    }
  };

  // 分配端口
  const allocatePort = async (values: PortAllocationRequest) => {
    try {
      const response = await api.post('/port-registry/allocate', values);
      if (response.success) {
        message.success(`端口 ${response.data.port} 分配成功`);
        setModalVisible(false);
        form.resetFields();
        fetchRegistrations();
      } else {
        message.error(response.message || '端口分配失败');
      }
    } catch (error) {
      console.error('Failed to allocate port:', error);
      message.error('端口分配失败');
    }
  };

  // 标记端口为使用中
  const markPortInUse = async (projectId: string) => {
    try {
      const response = await api.put(`/port-registry/mark-in-use/${projectId}`, {});
      if (response.success) {
        message.success(`端口 ${response.data.port} 已标记为使用中`);
        fetchRegistrations();
      } else {
        message.error(response.message || '标记端口状态失败');
      }
    } catch (error) {
      console.error('Failed to mark port in-use:', error);
      message.error('标记端口状态失败');
    }
  };

  // 释放端口
  const releasePort = async (projectId: string) => {
    try {
      const response = await api.put(`/port-registry/release/${projectId}`, {});
      if (response.success) {
        message.success(`端口 ${response.data.port} 已释放`);
        fetchRegistrations();
      } else {
        message.error(response.message || '释放端口失败');
      }
    } catch (error) {
      console.error('Failed to release port:', error);
      message.error('释放端口失败');
    }
  };

  // 清理过期注册
  const cleanupExpired = async () => {
    try {
      const response = await api.post('/port-registry/cleanup', {});
      if (response.success) {
        message.success('清理完成');
        fetchRegistrations();
      } else {
        message.error(response.message || '清理失败');
      }
    } catch (error) {
      console.error('Failed to cleanup expired registrations:', error);
      message.error('清理失败');
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'allocated':
        return 'blue';
      case 'in-use':
        return 'green';
      case 'released':
        return 'orange';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'allocated':
        return '已分配';
      case 'in-use':
        return '使用中';
      case 'released':
        return '已释放';
      default:
        return status;
    }
  };

  const columns = [
    {
      title: '项目ID',
      dataIndex: 'projectId',
      key: 'projectId',
      width: 200,
    },
    {
      title: '项目名称',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 150,
    },
    {
      title: '端口',
      dataIndex: 'port',
      key: 'port',
      width: 100,
      render: (port: number) => (
        <Tag color="blue">{port}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '分配时间',
      dataIndex: 'allocatedAt',
      key: 'allocatedAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '最后使用时间',
      dataIndex: 'lastUsedAt',
      key: 'lastUsedAt',
      width: 180,
      render: (date: string) => date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: '部署ID',
      dataIndex: 'deploymentId',
      key: 'deploymentId',
      width: 150,
      render: (deploymentId: string) => deploymentId || '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record: PortRegistration) => (
        <Space>
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => setSelectedRegistration(record)}
            />
          </Tooltip>
          {record.status === 'allocated' && (
            <Button
              type="link"
              size="small"
              onClick={() => markPortInUse(record.projectId)}
            >
              标记使用
            </Button>
          )}
          {record.status === 'in-use' && (
            <Popconfirm
              title="确定要释放这个端口吗？"
              onConfirm={() => releasePort(record.projectId)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" danger>
                释放
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="端口注册管理"
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchRegistrations}
              loading={loading}
            >
              刷新
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModalVisible(true)}
            >
              分配端口
            </Button>
            <Button onClick={cleanupExpired}>
              清理过期
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={registrations}
          rowKey="projectId"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 分配端口模态框 */}
      <Modal
        title="分配端口"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={allocatePort}
        >
          <Form.Item
            name="projectId"
            label="项目ID"
            rules={[{ required: true, message: '请输入项目ID' }]}
          >
            <Input placeholder="请输入项目ID" />
          </Form.Item>

          <Form.Item
            name="projectName"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>

          <Form.Item
            name="preferredPort"
            label="首选端口"
          >
            <Input
              type="number"
              placeholder="可选，留空将自动分配"
              min={3000}
              max={9999}
            />
          </Form.Item>

          <Form.Item
            name="deploymentId"
            label="部署ID"
          >
            <Input placeholder="可选" />
          </Form.Item>

          <Form.Item
            name={['metadata', 'environment']}
            label="环境"
          >
            <Select placeholder="选择环境" allowClear>
              <Option value="development">开发环境</Option>
              <Option value="staging">测试环境</Option>
              <Option value="production">生产环境</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name={['metadata', 'branch']}
            label="分支"
          >
            <Input placeholder="分支名称" />
          </Form.Item>

          <Form.Item
            name={['metadata', 'commit']}
            label="提交哈希"
          >
            <Input placeholder="Git提交哈希" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                分配端口
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                form.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情模态框 */}
      <Modal
        title="端口注册详情"
        open={!!selectedRegistration}
        onCancel={() => setSelectedRegistration(null)}
        footer={null}
        width={600}
      >
        {selectedRegistration && (
          <div>
            <p><strong>项目ID:</strong> {selectedRegistration.projectId}</p>
            <p><strong>项目名称:</strong> {selectedRegistration.projectName}</p>
            <p><strong>端口:</strong> {selectedRegistration.port}</p>
            <p><strong>状态:</strong> 
              <Tag color={getStatusColor(selectedRegistration.status)} style={{ marginLeft: 8 }}>
                {getStatusText(selectedRegistration.status)}
              </Tag>
            </p>
            <p><strong>分配时间:</strong> {new Date(selectedRegistration.allocatedAt).toLocaleString()}</p>
            {selectedRegistration.lastUsedAt && (
              <p><strong>最后使用时间:</strong> {new Date(selectedRegistration.lastUsedAt).toLocaleString()}</p>
            )}
            {selectedRegistration.deploymentId && (
              <p><strong>部署ID:</strong> {selectedRegistration.deploymentId}</p>
            )}
            {selectedRegistration.metadata && (
              <div>
                <p><strong>元数据:</strong></p>
                <pre style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
                  {JSON.stringify(selectedRegistration.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PortRegistryManager;
