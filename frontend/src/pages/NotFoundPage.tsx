import React from 'react';
import { Button, Result, Typography, Space, Card } from 'antd';
import { HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Text, Paragraph } = Typography;

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="content-area" style={{ 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 120px)', // 适应MainLayout的内容区域
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Card 
        className="glass-card" 
                 style={{
           maxWidth: '600px', 
           width: '100%',
           textAlign: 'center',
           background: 'var(--content-glass-bg)',
           border: '1px solid var(--content-glass-border)',
           backdropFilter: 'blur(20px)',
           borderRadius: '16px',
           boxShadow: 'var(--decoration-shadow)',
           position: 'relative',
           zIndex: 1
         }}
      >
        <Result
          status="404"
          title={
            <div style={{ 
              fontSize: '80px', 
              fontWeight: 'bold',
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
                             marginBottom: '20px'
            }}>
              404
            </div>
          }
          subTitle={
            <div style={{ marginTop: '20px' }}>
              <Text className="content-title" style={{ fontSize: '24px' }}>
                页面未找到
              </Text>
              <Paragraph className="content-text-secondary" style={{ 
                fontSize: '16px',
                marginTop: '16px',
                color: 'var(--content-text-secondary)'
              }}>
                抱歉，您访问的页面不存在或已被移动。
                <br />
                请检查URL是否正确，或返回首页继续浏览。
              </Paragraph>
            </div>
          }
          extra={
            <Space size="large" style={{ marginTop: '40px' }}>
              <Button 
                type="primary" 
                size="large" 
                icon={<HomeOutlined />}
                onClick={handleGoHome}
                className="content-button"
                style={{
                  background: 'var(--gradient-primary)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 24px',
                  height: '40px',
                  fontWeight: '500'
                }}
              >
                返回首页
              </Button>
              <Button 
                size="large" 
                icon={<ArrowLeftOutlined />}
                onClick={handleGoBack}
                style={{
                  background: 'var(--content-glass-bg)',
                  border: '1px solid var(--content-glass-border)',
                  color: 'var(--content-text)',
                  borderRadius: '8px',
                  padding: '8px 24px',
                  height: '40px',
                  fontWeight: '500',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                返回上页
              </Button>
            </Space>
          }
        />
      </Card>
    </div>
  );
};

export default NotFoundPage;
