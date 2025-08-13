import React, { useState, useRef, useMemo } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Tabs, 
  Typography, 
  Divider, 
  Space
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined,
  LoginOutlined,
  UserAddOutlined,
  GithubOutlined,
  RocketOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useAuth, LoginCredentials, RegisterCredentials } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import ThreeJSBackground from '../components/3d/ThreeJSBackground';
import FloatingGeometry from '../components/3d/FloatingGeometry';
import '../styles/login-page.css';

const { Title, Text } = Typography;

const LoginPage3D: React.FC = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const { login, register, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);

  // 获取重定向路径
  const from = (location.state as any)?.from?.pathname || '/';

  const handleLogin = async (values: LoginCredentials) => {
    const success = await login(values);
    if (success) {
      navigate(from, { replace: true });
    }
  };

  const handleRegister = async (values: RegisterCredentials) => {
    const success = await register(values);
    if (success) {
      // 注册成功后切换到登录页
      setActiveTab('login');
      loginForm.setFieldsValue({
        username: values.username,
        password: values.password
      });
    }
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  // 使用 useMemo 缓存登录表单，避免重复创建导致状态丢失
  const loginFormContent = useMemo(() => (
    <Form
      form={loginForm}
      name="login"
      onFinish={handleLogin}
      autoComplete="on"
      size="large"
      layout="inline"
      style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}
    >
             <Form.Item
         name="username"
         rules={[
           { required: true, message: '请输入用户名或邮箱' },
           { min: 2, message: '用户名至少2个字符' }
         ]}
         style={{ marginBottom: '8px', width: '100%' }}
       >
        <Input
          prefix={<UserOutlined style={{ color: 'rgba(255, 255, 255, 0.7)' }} />}
          placeholder="用户名或邮箱"
          autoComplete="username"
          className="glassmorphism-input"
          style={{
            height: '36px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 255, 255, 0.08)',
            fontSize: '14px',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            color: '#ffffff'
          }}
        />
      </Form.Item>

             <Form.Item
         name="password"
         rules={[
           { required: true, message: '请输入密码' },
           { min: 6, message: '密码至少6个字符' }
         ]}
         style={{ marginBottom: '8px', width: '100%' }}
       >
        <Input.Password
          prefix={<LockOutlined style={{ color: 'rgba(255, 255, 255, 0.7)' }} />}
          placeholder="密码"
          autoComplete="current-password"
          className="glassmorphism-input"
          style={{
            height: '36px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 255, 255, 0.08)',
            fontSize: '14px',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            color: '#ffffff'
          }}
        />
      </Form.Item>

      <Form.Item style={{ marginBottom: '8px', width: '100%' }}>
        <Button
          type="primary"
          htmlType="submit"
          loading={isLoading}
          className="glassmorphism-button"
          style={{ 
            width: '100%', 
            height: '36px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            fontWeight: 600,
            fontSize: '14px',
            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <span style={{ position: 'relative', zIndex: 1 }}>登录</span>
          <div style={{
            position: 'absolute',
            top: '0',
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            transition: 'left 0.5s ease'
          }} className="button-shine" />
        </Button>
      </Form.Item>
    </Form>
  ), [loginForm, isLoading]);

    // 使用 useMemo 缓存注册表单，避免重复创建导致状态丢失
  const registerFormContent = useMemo(() => (
    <Form
      form={registerForm}
      name="register"
      onFinish={handleRegister}
      autoComplete="on"
      size="large"
      layout="inline"
      style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px' }}
    >
      <Form.Item
        name="username"
        rules={[
          { required: true, message: '请输入用户名' },
          { min: 2, max: 20, message: '用户名长度2-20个字符' },
          { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' }
        ]}
        style={{ marginBottom: '4px', width: '100%' }}
      >
        <Input
          prefix={<UserOutlined style={{ color: 'rgba(255, 255, 255, 0.7)' }} />}
          placeholder="用户名"
          autoComplete="username"
          className="glassmorphism-input"
          style={{
            height: '32px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 255, 255, 0.08)',
            fontSize: '13px',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            color: '#ffffff'
          }}
        />
      </Form.Item>

      <Form.Item
        name="email"
        rules={[
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '请输入有效的邮箱地址' }
        ]}
        style={{ marginBottom: '4px', width: '100%' }}
      >
        <Input
          prefix={<MailOutlined style={{ color: 'rgba(255, 255, 255, 0.7)' }} />}
          placeholder="邮箱"
          autoComplete="email"
          className="glassmorphism-input"
          style={{
            height: '32px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 255, 255, 0.08)',
            fontSize: '13px',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            color: '#ffffff'
          }}
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[
          { required: true, message: '请输入密码' },
          { min: 6, message: '密码至少6个字符' },
          { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: '密码必须包含大小写字母和数字' }
        ]}
        style={{ marginBottom: '4px', width: '100%' }}
      >
        <Input.Password
          prefix={<LockOutlined style={{ color: 'rgba(255, 255, 255, 0.7)' }} />}
          placeholder="密码"
          autoComplete="new-password"
          className="glassmorphism-input"
          style={{
            height: '32px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 255, 255, 0.08)',
            fontSize: '13px',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            color: '#ffffff'
          }}
        />
      </Form.Item>

      <Form.Item
        name="confirmPassword"
        dependencies={['password']}
        rules={[
          { required: true, message: '请确认密码' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('两次输入的密码不一致'));
            },
          }),
        ]}
        style={{ marginBottom: '4px', width: '100%' }}
      >
        <Input.Password
          prefix={<LockOutlined style={{ color: 'rgba(255, 255, 255, 0.7)' }} />}
          placeholder="确认密码"
          autoComplete="new-password"
          className="glassmorphism-input"
          style={{
            height: '32px',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 255, 255, 0.08)',
            fontSize: '13px',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
            boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            color: '#ffffff'
          }}
        />
      </Form.Item>

      <Form.Item style={{ marginBottom: '4px', width: '100%' }}>
        <Button
          type="primary"
          htmlType="submit"
          loading={isLoading}
          className="glassmorphism-button"
          style={{ 
            width: '100%', 
            height: '32px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            fontWeight: 600,
            fontSize: '13px',
            boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <span style={{ position: 'relative', zIndex: 1 }}>注册</span>
          <div style={{
            position: 'absolute',
            top: '0',
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            transition: 'left 0.5s ease'
          }} className="button-shine" />
        </Button>
      </Form.Item>
    </Form>
  ), [registerForm, isLoading]);

  return (
    <ThreeJSBackground>
      <div 
        ref={containerRef}
        className="glassmorphism-container"
        style={{
          width: '100%',
          maxWidth: '900px',
          height: '500px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          boxShadow: `
            0 25px 80px rgba(0, 0, 0, 0.15),
            0 0 0 1px rgba(255, 255, 255, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.3)
          `,
          display: 'flex',
          overflow: 'hidden',
          position: 'relative',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          zIndex: 10
        }} 
      >
        {/* 高光反射效果 */}
        <div className="glassmorphism-highlight" style={{
          position: 'absolute',
          top: '0',
          left: '0',
          right: '0',
          height: '1px',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
          zIndex: 2
        }} />

                 {/* 左侧装饰区域 */}
         <div className="glassmorphism-left" style={{
           flex: '1',
           padding: '25px 20px',
           display: 'flex',
           flexDirection: 'column',
           justifyContent: 'center',
           alignItems: 'center',
           position: 'relative',
           zIndex: 2,
           background: 'rgba(255, 255, 255, 0.05)',
           borderRadius: '24px 0 0 24px'
         }}>
           <div style={{ textAlign: 'center', width: '100%' }}>
                         <div style={{
               width: '70px',
               height: '70px',
               background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
               borderRadius: '50%',
               margin: '0 auto 20px',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               fontSize: '28px',
               color: 'white',
               boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
             }}>
               <RocketOutlined />
             </div>
             
             <Title level={1} style={{ 
               margin: 0, 
               color: '#ffffff',
               fontWeight: 700,
               fontSize: '24px',
               marginBottom: '20px',
               textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
             }}>
               智能部署管理平台
             </Title>

                                                    {/* 功能特点列表 */}
               <div style={{ textAlign: 'center', maxWidth: '300px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <CheckCircleOutlined style={{ fontSize: '18px', marginRight: '12px', color: 'rgba(255,255,255,0.95)' }} />
                  <Text style={{ color: 'rgba(255,255,255,0.95)', fontSize: '15px', fontWeight: 500 }}>
                    一键部署，自动化管理
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <CheckCircleOutlined style={{ fontSize: '18px', marginRight: '12px', color: 'rgba(255,255,255,0.95)' }} />
                  <Text style={{ color: 'rgba(255,255,255,0.95)', fontSize: '15px', fontWeight: 500 }}>
                    实时监控，可视化展示
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <CheckCircleOutlined style={{ fontSize: '18px', marginRight: '12px', color: 'rgba(255,255,255,0.95)' }} />
                  <Text style={{ color: 'rgba(255,255,255,0.95)', fontSize: '15px', fontWeight: 500 }}>
                    团队协作，权限管理
                  </Text>
                </div>
              </div>
          </div>
        </div>

        {/* 右侧登录区域 */}
        <div className="glassmorphism-right" style={{
          flex: '1',
          padding: '20px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 2,
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '0 24px 24px 0'
        }}>
                     <div style={{ marginBottom: '12px', marginTop: '8px' }}>
             <Title level={2} style={{ 
               margin: 0, 
               color: '#ffffff',
               fontWeight: 700,
               fontSize: '18px',
               marginBottom: '4px',
               textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
             }}>
               {activeTab === 'login' ? '欢迎回来' : '创建账户'}
             </Title>
            <Text style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500, textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)' }}>
              {activeTab === 'login' ? '请登录您的账户以继续' : '请填写以下信息完成注册'}
            </Text>
          </div>

          <Tabs 
            activeKey={activeTab} 
            onChange={handleTabChange}
            size="large"
            style={{
              marginBottom: '8px'
            }}
            className="glassmorphism-tabs"
            tabBarStyle={{ marginBottom: '10px' }}
            items={[
              {
                key: 'login',
                label: (
                  <span style={{ fontSize: '14px', fontWeight: 600 }} className="glassmorphism-tab">
                    <LoginOutlined />
                    登录
                  </span>
                ),
                children: loginFormContent
              },
              {
                key: 'register',
                label: (
                  <span style={{ fontSize: '14px', fontWeight: 600 }} className="glassmorphism-tab">
                    <UserAddOutlined />
                    注册
                  </span>
                ),
                children: registerFormContent
              }
            ]}
          />

          <Divider style={{ margin: '4px 0' }}>
            <Text style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.8)', fontWeight: 500, textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)' }}>或</Text>
          </Divider>

          <Space direction="vertical" style={{ width: '100%' }}>
            <Button
              icon={<GithubOutlined />}
              className="glassmorphism-button-secondary"
              style={{ 
                width: '100%', 
                height: '32px',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '13px',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)',
                boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)'
              }}
              onClick={() => {
                // GitHub OAuth 登录（待实现）
              }}
            >
              使用 GitHub 登录
            </Button>
          </Space>

          <div style={{ marginTop: '4px', textAlign: 'center' }}>
            <Text style={{ fontSize: '10px', lineHeight: '1.3', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500, textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)' }}>
              登录即表示您同意我们的
              <a href="#" style={{ color: '#ffffff', fontWeight: 500 }}>服务条款</a>
              和
              <a href="#" style={{ color: '#ffffff', fontWeight: 500 }}>隐私政策</a>
            </Text>
          </div>
        </div>
      </div>
    </ThreeJSBackground>
  );
};

export default LoginPage3D;
