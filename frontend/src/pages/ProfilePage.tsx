import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Form, 
  Input, 
  Button, 
  Avatar, 
  Space, 
  Divider, 
  Row, 
  Col, 
  Upload, 
  App,
  Descriptions,
  Tag,
  Statistic,
  Row as AntRow,
  Col as AntCol
} from 'antd';
import { 
  UserOutlined, 
  MailOutlined, 
  EditOutlined, 
  SaveOutlined, 
  CloseOutlined,
  UploadOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  SafetyCertificateOutlined,
  GlobalOutlined,
  LockOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useAuth, User } from '../contexts/AuthContext';
import { api } from '../utils/api';
import { buildStaticUrl } from '../config/env';
import ChangePasswordModal from '../components/profile/ChangePasswordModal';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface ProfileFormData {
  username: string;
  email: string;
  bio: string;
  avatar_url?: string;
}

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

  // 初始化表单数据
  useEffect(() => {
    if (user && isEditing) {
      // 表单数据会在编辑模式下通过 Form 组件的 initialValues 设置
    }
  }, [user, isEditing]);

  // 处理编辑模式切换
  const handleEdit = () => {
    setIsEditing(true);
  };

  // 处理取消编辑
  const handleCancel = () => {
    setIsEditing(false);
  };

  // 处理保存个人资料
  const handleSave = async (values: any) => {
    try {
      setLoading(true);
      
      const response = await api.put('/auth/profile', values);
      
      if (response.success) {
        // 更新本地用户信息
        updateUser(response.data.user);
        message.success('个人资料更新成功');
        setIsEditing(false);
      } else {
        message.error(response.message || '更新失败');
      }
    } catch (error) {
      console.error('更新个人资料失败:', error);
      message.error('更新失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  // 处理头像上传
  const handleAvatarUpload = async (file: File) => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await api.post('/auth/upload-avatar', formData);
      
      if (response.success) {
        // 更新头像URL
        console.log('头像上传成功，新URL:', response.data.avatar_url);
        updateUser({ avatar_url: response.data.avatar_url });
        message.success('头像上传成功');
      } else {
        message.error(response.message || '头像上传失败');
      }
    } catch (error) {
      console.error('头像上传失败:', error);
      message.error('头像上传失败，请检查网络连接');
    } finally {
      setUploading(false);
    }
  };

  // 上传配置
  const uploadProps = {
    beforeUpload: (file: File) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只能上传图片文件！');
        return false;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('图片大小不能超过2MB！');
        return false;
      }
      handleAvatarUpload(file);
      return false; // 阻止自动上传
    },
    showUploadList: false,
  };

  // 格式化日期
  const formatDate = (dateString?: string) => {
    if (!dateString) return '未知';
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 获取角色标签颜色
  const getRoleColor = (role: string) => {
    const roleColors: { [key: string]: string } = {
      admin: 'red',
      user: 'blue',
      moderator: 'green',
      guest: 'default'
    };
    return roleColors[role] || 'default';
  };

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
            个人资料
          </Title>
          <Text className="content-text-secondary">
            管理您的个人信息和账户设置
          </Text>
        </div>

        <Row gutter={[32, 32]}>
          {/* 左侧：头像和基本信息 */}
          <Col xs={24} lg={8}>
            <Card className="glass-card" style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: 24 }}>
                <Upload {...uploadProps}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                                         <Avatar 
                       size={120}
                       src={user?.avatar_url ? buildStaticUrl(user.avatar_url) : undefined}
                       icon={<UserOutlined />}
                                             onError={(e) => {
                         console.error('头像加载失败:', user?.avatar_url);
                         console.error('完整URL:', user?.avatar_url ? buildStaticUrl(user.avatar_url) : '无');
                       }}
                      style={{
                        background: 'var(--gradient-primary)',
                        border: '4px solid rgba(255,255,255,0.2)',
                        cursor: isEditing ? 'pointer' : 'default'
                      }}
                    />
                    {isEditing && (
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        background: 'var(--gradient-primary)',
                        borderRadius: '50%',
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        border: '2px solid white'
                      }}>
                        <UploadOutlined style={{ color: 'white', fontSize: 14 }} />
                      </div>
                    )}
                  </div>
                </Upload>
                {isEditing && (
                  <div style={{ marginTop: 8 }}>
                    <Text className="content-text-secondary" style={{ fontSize: '12px' }}>
                      点击头像上传新图片
                    </Text>
                  </div>
                )}
              </div>

              <Title level={3} className="content-title" style={{ margin: 0, marginBottom: 8 }}>
                {user?.username}
              </Title>
              
              <Tag color={getRoleColor(user?.role || '')} style={{ marginBottom: 16 }}>
                {user?.role === 'admin' ? '管理员' : 
                 user?.role === 'moderator' ? '版主' : 
                 user?.role === 'guest' ? '访客' : '用户'}
              </Tag>

              <div style={{ marginBottom: 24 }}>
                <AntRow gutter={16}>
                  <AntCol span={12}>
                    <Statistic 
                      title="账户状态" 
                      value={user?.is_active ? '活跃' : '禁用'}
                      valueStyle={{ 
                        color: user?.is_active ? '#52c41a' : '#ff4d4f',
                        fontSize: '14px'
                      }}
                    />
                  </AntCol>
                  <AntCol span={12}>
                    <Statistic 
                      title="注册时间" 
                      value={user?.created_at ? formatDate(user.created_at).split(' ')[0] : '未知'}
                      valueStyle={{ fontSize: '14px' }}
                    />
                  </AntCol>
                </AntRow>
              </div>

              {!isEditing && (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button 
                    type="primary" 
                    icon={<EditOutlined />}
                    onClick={handleEdit}
                    className="content-button"
                    style={{ width: '100%' }}
                  >
                    编辑资料
                  </Button>
                  <Button 
                    icon={<SettingOutlined />}
                    onClick={() => navigate('/account-settings')}
                    style={{
                      background: 'var(--content-glass-bg)',
                      border: '1px solid var(--content-glass-border)',
                      color: 'var(--content-text)',
                      width: '100%'
                    }}
                  >
                    账户设置
                  </Button>
                </Space>
              )}
            </Card>
          </Col>

          {/* 右侧：详细信息 */}
          <Col xs={24} lg={16}>
            <Card className="glass-card">
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 24
              }}>
                <Title level={3} className="content-title" style={{ margin: 0 }}>
                  详细信息
                </Title>
                {isEditing && (
                  <Space>
                    <Button 
                      icon={<CloseOutlined />}
                      onClick={handleCancel}
                      style={{
                        background: 'var(--content-glass-bg)',
                        border: '1px solid var(--content-glass-border)',
                        color: 'var(--content-text)'
                      }}
                    >
                      取消
                    </Button>
                    <Button 
                      type="primary" 
                      icon={<SaveOutlined />}
                      htmlType="submit"
                      loading={loading}
                      className="content-button"
                    >
                      保存
                    </Button>
                  </Space>
                )}
              </div>

              {!isEditing ? (
                // 查看模式
                                 <Descriptions 
                   column={1} 
                   bordered 
                   size="small"
                   styles={{
                     label: { 
                       fontWeight: 600,
                       color: 'var(--content-text)',
                       width: '120px'
                     },
                     content: { 
                       color: 'var(--content-text-secondary)'
                     }
                   }}
                 >
                  <Descriptions.Item label="用户名" icon={<UserOutlined />}>
                    {user?.username}
                  </Descriptions.Item>
                  <Descriptions.Item label="邮箱" icon={<MailOutlined />}>
                    {user?.email}
                  </Descriptions.Item>
                  <Descriptions.Item label="个人简介" icon={<GlobalOutlined />}>
                    {user?.bio || '暂无简介'}
                  </Descriptions.Item>
                  <Descriptions.Item label="最后登录" icon={<ClockCircleOutlined />}>
                    {user?.last_login_at ? formatDate(user.last_login_at) : '从未登录'}
                  </Descriptions.Item>
                  <Descriptions.Item label="账户ID" icon={<SafetyCertificateOutlined />}>
                    {user?.uuid}
                  </Descriptions.Item>
                </Descriptions>
              ) : (
                // 编辑模式
                <Form
                  layout="vertical"
                  style={{ maxWidth: '600px' }}
                  initialValues={{
                    username: user?.username,
                    email: user?.email,
                    bio: user?.bio || '',
                    avatar_url: user?.avatar_url
                  }}
                  onFinish={handleSave}
                >
                  <Form.Item
                    label="用户名"
                    name="username"
                    rules={[
                      { required: true, message: '请输入用户名' },
                      { min: 3, message: '用户名至少3个字符' },
                      { max: 20, message: '用户名最多20个字符' }
                    ]}
                  >
                    <Input 
                      prefix={<UserOutlined />} 
                      placeholder="请输入用户名"
                      disabled // 用户名通常不允许修改
                    />
                  </Form.Item>

                  <Form.Item
                    label="邮箱"
                    name="email"
                    rules={[
                      { required: true, message: '请输入邮箱' },
                      { type: 'email', message: '请输入有效的邮箱地址' }
                    ]}
                  >
                    <Input 
                      prefix={<MailOutlined />} 
                      placeholder="请输入邮箱地址"
                    />
                  </Form.Item>

                  <Form.Item
                    label="个人简介"
                    name="bio"
                    rules={[
                      { max: 200, message: '个人简介最多200个字符' }
                    ]}
                  >
                    <TextArea 
                      rows={4}
                      placeholder="介绍一下自己吧..."
                      showCount
                      maxLength={200}
                    />
                  </Form.Item>

                  <Form.Item
                    label="头像URL"
                    name="avatar_url"
                  >
                    <Input 
                      placeholder="头像图片URL"
                      disabled
                    />
                  </Form.Item>
                </Form>
              )}
            </Card>

            {/* 账户安全信息 */}
            <Card className="glass-card" style={{ marginTop: 24 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 16
              }}>
                <Title level={4} className="content-title" style={{ margin: 0 }}>
                  账户安全
                </Title>
                <Button 
                  type="primary" 
                  icon={<LockOutlined />}
                  onClick={() => setPasswordModalVisible(true)}
                  className="content-button"
                  size="small"
                >
                  修改密码
                </Button>
              </div>
                             <Descriptions 
                 column={1} 
                 size="small"
                 styles={{
                   label: { 
                     fontWeight: 600,
                     color: 'var(--content-text)',
                     width: '120px'
                   },
                   content: { 
                     color: 'var(--content-text-secondary)'
                   }
                 }}
               >
                <Descriptions.Item label="账户状态">
                  <Tag color={user?.is_active ? 'success' : 'error'}>
                    {user?.is_active ? '活跃' : '禁用'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="注册时间" icon={<CalendarOutlined />}>
                  {user?.created_at ? formatDate(user.created_at) : '未知'}
                </Descriptions.Item>
                <Descriptions.Item label="最后登录" icon={<ClockCircleOutlined />}>
                  {user?.last_login_at ? formatDate(user.last_login_at) : '从未登录'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
      </div>
      
      {/* 密码修改模态框 */}
      <ChangePasswordModal
        visible={passwordModalVisible}
        onClose={() => setPasswordModalVisible(false)}
      />
    </div>
  );
};

export default ProfilePage;
