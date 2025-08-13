import React, { useState } from 'react';
import { Card, Typography, Form, Input, Select, Switch, Button, Space, Table, Tag, Modal, message, Progress, Row, Col } from 'antd';
import { 
  SettingOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  SaveOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface DeploymentConfig {
  id: number;
  project_name: string;
  environment: string;
  branch: string;
  build_command: string;
  deploy_command: string;
  auto_deploy: boolean;
  notification_enabled: boolean;
  status: 'active' | 'inactive';
}

const DeploymentConfigPage: React.FC = () => {
  const [form] = Form.useForm();
  const [configs, setConfigs] = useState<DeploymentConfig[]>([
    {
      id: 1,
      project_name: 'axi-project-dashboard',
      environment: 'production',
      branch: 'main',
      build_command: 'pnpm build',
      deploy_command: 'pm2 restart axi-dashboard',
      auto_deploy: true,
      notification_enabled: true,
      status: 'active'
    },
    {
      id: 2,
      project_name: 'axi-star-cloud',
      environment: 'staging',
      branch: 'develop',
      build_command: 'go build -o main',
      deploy_command: 'docker-compose up -d',
      auto_deploy: false,
      notification_enabled: true,
      status: 'active'
    }
  ]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState<DeploymentConfig | null>(null);

  // 计算配置完成度
  const calculateConfigCompletion = (config: DeploymentConfig) => {
    let completion = 0;
    if (config.project_name) completion += 20;
    if (config.environment) completion += 20;
    if (config.branch) completion += 20;
    if (config.build_command) completion += 20;
    if (config.deploy_command) completion += 20;
    return completion;
  };

  // 计算总体配置完成度
  const totalCompletion = configs.length > 0 
    ? Math.round(configs.reduce((sum, config) => sum + calculateConfigCompletion(config), 0) / configs.length)
    : 0;

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'project_name',
      key: 'project_name',
      render: (text: string) => <Text strong className="content-text">{text}</Text>,
    },
    {
      title: '环境',
      dataIndex: 'environment',
      key: 'environment',
      render: (environment: string) => {
        const envConfig = {
          production: { color: 'red', text: '生产环境' },
          staging: { color: 'orange', text: '预发环境' },
          development: { color: 'green', text: '开发环境' },
        };
        const config = envConfig[environment as keyof typeof envConfig] || { color: 'default', text: environment };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '分支',
      dataIndex: 'branch',
      key: 'branch',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '自动部署',
      dataIndex: 'auto_deploy',
      key: 'auto_deploy',
      render: (enabled: boolean) => (
        <Tag color={enabled ? 'success' : 'default'}>
          {enabled ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '配置完成度',
      key: 'completion',
      render: (record: DeploymentConfig) => {
        const completion = calculateConfigCompletion(record);
        return (
          <div style={{ width: '120px' }}>
            <Progress 
              percent={completion} 
              size={[120, 8]}
              status={completion >= 100 ? 'success' : completion >= 80 ? 'normal' : 'active'}
              strokeColor={{
                '0%': '#667eea',
                '100%': '#764ba2',
              }}
            />
          </div>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'success' : 'default'}>
          {status === 'active' ? '活跃' : '停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: DeploymentConfig) => (
        <Space size="small">
          <Button 
            type="link" 
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingConfig(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (config: DeploymentConfig) => {
    setEditingConfig(config);
    form.setFieldsValue(config);
    setIsModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个部署配置吗？',
      onOk: () => {
        setConfigs(configs.filter(config => config.id !== id));
        message.success('配置已删除');
      }
    });
  };

  const handleSubmit = (values: any) => {
    if (editingConfig) {
      // 编辑现有配置
      setConfigs(configs.map(config => 
        config.id === editingConfig.id ? { ...config, ...values } : config
      ));
      message.success('配置已更新');
    } else {
      // 添加新配置
      const newConfig: DeploymentConfig = {
        id: Date.now(),
        ...values,
        status: 'active'
      };
      setConfigs([...configs, newConfig]);
      message.success('配置已添加');
    }
    setIsModalVisible(false);
  };

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
        <Col xs={24} sm={12} lg={8}>
          <Card className="glass-card">
            <div style={{ textAlign: 'center' }}>
              <Text className="content-text-secondary">配置总数</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--content-text)', marginTop: '8px' }}>
                {configs.length}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card className="glass-card">
            <div style={{ textAlign: 'center' }}>
              <Text className="content-text-secondary">活跃配置</Text>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--content-text)', marginTop: '8px' }}>
                {configs.filter(config => config.status === 'active').length}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card className="glass-card">
            <div style={{ textAlign: 'center' }}>
              <Text className="content-text-secondary">配置完成度</Text>
              <Progress 
                percent={totalCompletion} 
                size={[120, 8]}
                status={totalCompletion >= 100 ? 'success' : totalCompletion >= 80 ? 'normal' : 'active'}
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

      {/* 操作按钮 */}
      <Card className="glass-card" style={{ marginBottom: '24px' }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          添加配置
        </Button>
      </Card>

      {/* 配置列表 */}
      <Card className="glass-card">
        <Table
          columns={columns}
          dataSource={configs}
          rowKey="id"
          pagination={{
            total: configs.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          className="content-table"
        />
      </Card>

      {/* 配置表单模态框 */}
      <Modal
        title={editingConfig ? '编辑部署配置' : '添加部署配置'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            auto_deploy: true,
            notification_enabled: true
          }}
        >
          <Form.Item
            name="project_name"
            label="项目名称"
            rules={[{ required: true, message: '请输入项目名称' }]}
          >
            <Input placeholder="请输入项目名称" />
          </Form.Item>

          <Form.Item
            name="environment"
            label="部署环境"
            rules={[{ required: true, message: '请选择部署环境' }]}
          >
            <Select placeholder="请选择部署环境">
              <Option value="production">生产环境</Option>
              <Option value="staging">预发环境</Option>
              <Option value="development">开发环境</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="branch"
            label="部署分支"
            rules={[{ required: true, message: '请输入部署分支' }]}
          >
            <Input placeholder="请输入部署分支，如：main" />
          </Form.Item>

          <Form.Item
            name="build_command"
            label="构建命令"
            rules={[{ required: true, message: '请输入构建命令' }]}
          >
            <TextArea 
              placeholder="请输入构建命令，如：pnpm build"
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="deploy_command"
            label="部署命令"
            rules={[{ required: true, message: '请输入部署命令' }]}
          >
            <TextArea 
              placeholder="请输入部署命令，如：pm2 restart app"
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="auto_deploy"
            label="自动部署"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="notification_enabled"
            label="启用通知"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                {editingConfig ? '更新' : '添加'}
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      </div>
    </div>
  );
};

export default DeploymentConfigPage;
