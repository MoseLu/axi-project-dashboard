import React from 'react';
import { Button, Card, Typography, Space, Progress, Row, Col } from 'antd';
import { 
  ClockCircleOutlined, 
  CheckCircleOutlined,
  HomeOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

interface ComingSoonPageProps {
  title: string;
  description?: string;
  features?: string[];
  progress?: number;
  estimatedTime?: string;
}

const ComingSoonPage: React.FC<ComingSoonPageProps> = ({
  title,
  description = "我们正在努力开发这个功能，敬请期待！",
  features = [],
  progress = 65,
  estimatedTime = "预计2-3周内完成"
}) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const defaultFeatures = [
    "现代化的用户界面设计",
    "实时数据监控和分析",
    "智能化的操作建议",
    "完整的权限管理系统",
    "多语言国际化支持"
  ];

  const displayFeatures = features.length > 0 ? features : defaultFeatures;

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
        <Row gutter={[32, 32]} align="middle">
          <Col xs={24} lg={12}>
                         <div style={{ 
               textAlign: 'center'
             }}>
              <div style={{
                width: '120px',
                height: '120px',
                background: 'var(--gradient-primary)',
                borderRadius: '50%',
                margin: '0 auto 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                color: 'white',
                                 boxShadow: '0 8px 32px rgba(24, 144, 255, 0.3)'
              }}>
                <ClockCircleOutlined />
              </div>
              
              <Title level={1} className="content-title" style={{ 
                marginBottom: 16,
                fontSize: '48px',
                fontWeight: 'bold'
              }}>
                {title}
              </Title>
              
              <Paragraph className="content-text-secondary" style={{ 
                fontSize: '18px',
                marginBottom: 32,
                lineHeight: 1.6
              }}>
                {description}
              </Paragraph>
              
              <Space size="large">
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<HomeOutlined />}
                  onClick={handleGoHome}
                  className="content-button"
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
                    color: 'var(--content-text)'
                  }}
                >
                  返回上页
                </Button>
              </Space>
            </div>
          </Col>
          
          <Col xs={24} lg={12}>
                         <Card className="glass-card">
              <div style={{ marginBottom: 24 }}>
                <Title level={3} className="content-title" style={{ margin: 0, marginBottom: 16 }}>
                  开发进度
                </Title>
                <Progress
                  percent={progress}
                  status={progress >= 90 ? 'success' : progress >= 70 ? 'normal' : 'active'}
                  strokeColor={{
                    '0%': '#667eea',
                    '100%': '#764ba2',
                  }}
                  size={[undefined, 12]}
                  trailColor="rgba(255,255,255,0.2)"
                  className="content-progress"
                  style={{ width: '100%' }}
                />
                <Text className="content-text-secondary" style={{ fontSize: '14px' }}>
                  {estimatedTime}
                </Text>
              </div>
              
              <div>
                <Title level={4} className="content-title" style={{ margin: 0, marginBottom: 16 }}>
                  功能特性
                </Title>
                <div style={{ display: 'grid', gap: '12px' }}>
                  {displayFeatures.map((feature, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: 'var(--content-glass-bg)',
                                             borderRadius: '8px',
                       border: '1px solid var(--content-glass-border)'
                    }}>
                      <CheckCircleOutlined style={{ 
                        color: '#52c41a',
                        fontSize: '16px'
                      }} />
                      <Text className="content-text" style={{ margin: 0 }}>
                        {feature}
                      </Text>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default ComingSoonPage;
