import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Form, 
  Switch, 
  Button, 
  Space, 
  Divider, 
  Row, 
  Col, 
  Select, 
  InputNumber,
  App,
  Alert,
  List,
  Tag
} from 'antd';
import { 
  BellOutlined, 
  SafetyOutlined, 
  EyeOutlined, 
  SaveOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { api } from '../utils/api';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  deployment_alerts: boolean;
  system_updates: boolean;
  marketing_emails: boolean;
}

interface PrivacySettings {
  profile_visibility: 'public' | 'private' | 'friends';
  show_online_status: boolean;
  allow_friend_requests: boolean;
  data_collection: boolean;
}

interface SecuritySettings {
  two_factor_auth: boolean;
  login_notifications: boolean;
  session_timeout: number;
  max_login_attempts: number;
}

const AccountSettingsPage: React.FC = () => {
  const { message } = App.useApp();
  const [notificationForm] = Form.useForm();
  const [privacyForm] = Form.useForm();
  const [securityForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 初始化设置
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/settings');
      
      if (response.success) {
        const { notifications, privacy, security } = response.data;
        
        notificationForm.setFieldsValue(notifications);
        privacyForm.setFieldsValue(privacy);
        securityForm.setFieldsValue(security);
      }
    } catch (error) {
      console.error('加载设置失败:', error);
      message.error('加载设置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      setSaving(true);
      const values = await notificationForm.validateFields();
      
      const response = await api.put('/auth/settings/notifications', values);
      
      if (response.success) {
        message.success('通知设置已保存');
      } else {
        message.error(response.message || '保存失败');
      }
    } catch (error) {
      console.error('保存通知设置失败:', error);
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrivacy = async () => {
    try {
      setSaving(true);
      const values = await privacyForm.validateFields();
      
      const response = await api.put('/auth/settings/privacy', values);
      
      if (response.success) {
        message.success('隐私设置已保存');
      } else {
        message.error(response.message || '保存失败');
      }
    } catch (error) {
      console.error('保存隐私设置失败:', error);
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSecurity = async () => {
    try {
      setSaving(true);
      const values = await securityForm.validateFields();
      
      const response = await api.put('/auth/settings/security', values);
      
      if (response.success) {
        message.success('安全设置已保存');
      } else {
        message.error(response.message || '保存失败');
      }
    } catch (error) {
      console.error('保存安全设置失败:', error);
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const notificationOptions = [
    {
      title: '邮件通知',
      description: '接收重要事件的邮件通知',
      key: 'email_notifications'
    },
    {
      title: '推送通知',
      description: '在浏览器中显示推送通知',
      key: 'push_notifications'
    },
    {
      title: '部署警报',
      description: '部署成功或失败时通知',
      key: 'deployment_alerts'
    },
    {
      title: '系统更新',
      description: '系统维护和更新通知',
      key: 'system_updates'
    },
    {
      title: '营销邮件',
      description: '接收产品更新和营销信息',
      key: 'marketing_emails'
    }
  ];

  const privacyOptions = [
    {
      title: '个人资料可见性',
      description: '控制谁可以看到您的个人资料',
      key: 'profile_visibility'
    },
    {
      title: '在线状态',
      description: '显示您的在线状态',
      key: 'show_online_status'
    },
    {
      title: '好友请求',
      description: '允许其他用户发送好友请求',
      key: 'allow_friend_requests'
    },
    {
      title: '数据收集',
      description: '允许收集使用数据以改善服务',
      key: 'data_collection'
    }
  ];

  const securityOptions = [
    {
      title: '双重认证',
      description: '启用双重认证以提高账户安全性',
      key: 'two_factor_auth'
    },
    {
      title: '登录通知',
      description: '新设备登录时发送通知',
      key: 'login_notifications'
    },
    {
      title: '会话超时',
      description: '设置自动登出的时间（分钟）',
      key: 'session_timeout'
    },
    {
      title: '最大登录尝试',
      description: '设置最大登录失败次数',
      key: 'max_login_attempts'
    }
  ];

  return (
    <div className="content-area" style={{ 
      minHeight: 'calc(100vh - 120px)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        {/* 页面标题 */}
        <div style={{ marginBottom: 32 }}>
          <Title level={2} className="content-title" style={{ margin: 0 }}>
            账户设置
          </Title>
          <Text className="content-text-secondary">
            管理您的账户偏好和安全设置
          </Text>
        </div>

        <Row gutter={[32, 32]}>
          {/* 通知设置 */}
          <Col xs={24} lg={12}>
            <Card className="glass-card">
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 24
              }}>
                <div>
                  <Title level={3} className="content-title" style={{ margin: 0, marginBottom: 4 }}>
                    <BellOutlined style={{ marginRight: 8 }} />
                    通知设置
                  </Title>
                  <Text className="content-text-secondary">
                    管理您接收的通知类型
                  </Text>
                </div>
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />}
                  onClick={handleSaveNotifications}
                  loading={saving}
                  className="content-button"
                  size="small"
                >
                  保存
                </Button>
              </div>

              <Form
                form={notificationForm}
                layout="vertical"
              >
                {notificationOptions.map((option) => (
                  <Form.Item
                    key={option.key}
                    label={option.title}
                    name={option.key}
                    valuePropName="checked"
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '12px 0'
                    }}>
                      <div>
                        <Text className="content-text" style={{ display: 'block' }}>
                          {option.title}
                        </Text>
                        <Text className="content-text-secondary" style={{ fontSize: '12px' }}>
                          {option.description}
                        </Text>
                      </div>
                      <Switch />
                    </div>
                  </Form.Item>
                ))}
              </Form>
            </Card>
          </Col>

          {/* 隐私设置 */}
          <Col xs={24} lg={12}>
            <Card className="glass-card">
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 24
              }}>
                <div>
                  <Title level={3} className="content-title" style={{ margin: 0, marginBottom: 4 }}>
                    <EyeOutlined style={{ marginRight: 8 }} />
                    隐私设置
                  </Title>
                  <Text className="content-text-secondary">
                    控制您的隐私和数据使用
                  </Text>
                </div>
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />}
                  onClick={handleSavePrivacy}
                  loading={saving}
                  className="content-button"
                  size="small"
                >
                  保存
                </Button>
              </div>

              <Form
                form={privacyForm}
                layout="vertical"
              >
                <Form.Item
                  label="个人资料可见性"
                  name="profile_visibility"
                >
                  <Select placeholder="选择可见性">
                    <Option value="public">公开</Option>
                    <Option value="friends">仅好友</Option>
                    <Option value="private">私密</Option>
                  </Select>
                </Form.Item>

                {privacyOptions.slice(1).map((option) => (
                  <Form.Item
                    key={option.key}
                    label={option.title}
                    name={option.key}
                    valuePropName="checked"
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '12px 0'
                    }}>
                      <div>
                        <Text className="content-text" style={{ display: 'block' }}>
                          {option.title}
                        </Text>
                        <Text className="content-text-secondary" style={{ fontSize: '12px' }}>
                          {option.description}
                        </Text>
                      </div>
                      <Switch />
                    </div>
                  </Form.Item>
                ))}
              </Form>
            </Card>
          </Col>

          {/* 安全设置 */}
          <Col xs={24}>
            <Card className="glass-card">
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 24
              }}>
                <div>
                  <Title level={3} className="content-title" style={{ margin: 0, marginBottom: 4 }}>
                    <SafetyOutlined style={{ marginRight: 8 }} />
                    安全设置
                  </Title>
                  <Text className="content-text-secondary">
                    保护您的账户安全
                  </Text>
                </div>
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />}
                  onClick={handleSaveSecurity}
                  loading={saving}
                  className="content-button"
                  size="small"
                >
                  保存
                </Button>
              </div>

              <Form
                form={securityForm}
                layout="vertical"
              >
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    {securityOptions.slice(0, 2).map((option) => (
                      <Form.Item
                        key={option.key}
                        label={option.title}
                        name={option.key}
                        valuePropName="checked"
                      >
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center',
                          padding: '12px 0'
                        }}>
                          <div>
                            <Text className="content-text" style={{ display: 'block' }}>
                              {option.title}
                            </Text>
                            <Text className="content-text-secondary" style={{ fontSize: '12px' }}>
                              {option.description}
                            </Text>
                          </div>
                          <Switch />
                        </div>
                      </Form.Item>
                    ))}
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label="会话超时（分钟）"
                      name="session_timeout"
                    >
                      <InputNumber
                        min={5}
                        max={1440}
                        placeholder="30"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                    <Form.Item
                      label="最大登录尝试次数"
                      name="max_login_attempts"
                    >
                      <InputNumber
                        min={3}
                        max={10}
                        placeholder="5"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </Card>
          </Col>
        </Row>

        {/* 设置说明 */}
        <Card className="glass-card" style={{ marginTop: 24 }}>
          <Title level={4} className="content-title" style={{ margin: 0, marginBottom: 16 }}>
            设置说明
          </Title>
          <List
            size="small"
            dataSource={[
              '通知设置：控制您接收的各种通知类型，包括邮件、推送和系统通知。',
              '隐私设置：管理您的个人资料可见性和数据使用偏好。',
              '安全设置：配置账户安全选项，包括双重认证和登录限制。',
              '所有设置都会实时保存，您可以随时修改这些偏好。'
            ]}
            renderItem={(item) => (
              <List.Item>
                <Text className="content-text-secondary" style={{ fontSize: '14px' }}>
                  {item}
                </Text>
              </List.Item>
            )}
          />
        </Card>
      </div>
    </div>
  );
};

export default AccountSettingsPage;
