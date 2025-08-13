import React from 'react';
import { Card, Button, Space, Typography, Row, Col, Divider, Alert } from 'antd';
import { SunOutlined, MoonOutlined, ExperimentOutlined } from '@ant-design/icons';
import useThemeTransition from '../hooks/useThemeTransition';
import { useSettings } from '../contexts/SettingsContext';

const { Title, Paragraph, Text } = Typography;

const ThemeTestPage: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { triggerTransition, isSupported, getPerformanceMetrics } = useThemeTransition();

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    const oldTheme = document.documentElement.getAttribute('data-theme') as 'light' | 'dark';
    
    // 触发动画
    triggerTransition(oldTheme, newTheme);
    
    // 更新设置
    updateSettings({ theme: newTheme });
  };

  const handleManualAnimation = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') as 'light' | 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    triggerTransition(currentTheme, newTheme);
  };

  const performanceMetrics = getPerformanceMetrics();

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>
        <ExperimentOutlined /> 主题切换动画测试
      </Title>
      
      <Alert
        message="主题切换动画功能"
        description="这个页面用于测试和演示主题切换动画效果。动画以右上角为圆心，半径逐渐增大的第三象限圆弧扩散，圆弧左侧显示旧主题，右侧显示新主题。"
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title="动画控制" bordered={false}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Title level={4}>当前主题</Title>
              <div style={{ 
                padding: '16px', 
                borderRadius: '8px',
                background: settings.theme === 'dark' ? '#141414' : '#ffffff',
                border: '1px solid #d9d9d9',
                color: settings.theme === 'dark' ? '#ffffff' : '#000000'
              }}>
                <Text strong>
                  {settings.theme === 'dark' ? '深色主题' : settings.theme === 'light' ? '浅色主题' : '跟随系统'}
                </Text>
                <br />
                <Text type="secondary">
                  实际显示: {document.documentElement.getAttribute('data-theme') === 'dark' ? '深色' : '浅色'}
                </Text>
              </div>

              <Divider />

              <Title level={4}>主题切换</Title>
              <Space wrap>
                <Button
                  type="primary"
                  icon={<SunOutlined />}
                  onClick={() => handleThemeChange('light')}
                  disabled={settings.theme === 'light'}
                >
                  切换到浅色主题
                </Button>
                <Button
                  type="primary"
                  icon={<MoonOutlined />}
                  onClick={() => handleThemeChange('dark')}
                  disabled={settings.theme === 'dark'}
                >
                  切换到深色主题
                </Button>
                <Button
                  icon={<ExperimentOutlined />}
                  onClick={handleManualAnimation}
                >
                  手动触发动画
                </Button>
              </Space>

              <Divider />

              <Title level={4}>系统设置</Title>
              <Button
                onClick={() => updateSettings({ theme: 'auto' })}
                disabled={settings.theme === 'auto'}
              >
                跟随系统主题
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="性能信息" bordered={false}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Title level={4}>支持状态</Title>
              <div>
                <Text>动画支持: </Text>
                <Text type={isSupported() ? 'success' : 'danger'}>
                  {isSupported() ? '✅ 支持' : '❌ 不支持'}
                </Text>
              </div>

              {performanceMetrics && (
                <>
                  <Divider />
                  <Title level={4}>性能指标</Title>
                  <div>
                    <Text>GPU加速: </Text>
                    <Text type={performanceMetrics.supportsGPU ? 'success' : 'warning'}>
                      {performanceMetrics.supportsGPU ? '✅ 支持' : '⚠️ 不支持'}
                    </Text>
                  </div>
                  <div>
                    <Text>CSS变量: </Text>
                    <Text type={performanceMetrics.supportsCSSVariables ? 'success' : 'warning'}>
                      {performanceMetrics.supportsCSSVariables ? '✅ 支持' : '⚠️ 不支持'}
                    </Text>
                  </div>
                  <div>
                    <Text>减少动画偏好: </Text>
                    <Text type={performanceMetrics.prefersReducedMotion ? 'warning' : 'success'}>
                      {performanceMetrics.prefersReducedMotion ? '⚠️ 用户偏好减少动画' : '✅ 正常'}
                    </Text>
                  </div>
                  <div>
                    <Text>设备像素比: </Text>
                    <Text>{performanceMetrics.devicePixelRatio}</Text>
                  </div>
                </>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
        <Col span={24}>
          <Card title="动画说明" bordered={false}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Paragraph>
                <Text strong>动画效果说明：</Text>
              </Paragraph>
              <ul>
                <li>
                  <Text>动画以右上角为圆心，半径逐渐增大的第三象限圆弧扩散</Text>
                </li>
                <li>
                  <Text>圆弧左侧显示旧主题颜色，右侧显示新主题颜色</Text>
                </li>
                <li>
                  <Text>动画持续时间为0.8秒，使用缓动函数确保流畅</Text>
                </li>
                <li>
                  <Text>圆弧扩展到左下角顶点时动画结束</Text>
                </li>
                <li>
                  <Text>支持响应式设计，在不同屏幕尺寸下自适应</Text>
                </li>
                <li>
                  <Text>尊重用户的减少动画偏好设置</Text>
                </li>
                <li>
                  <Text>使用GPU加速优化性能</Text>
                </li>
              </ul>

              <Divider />

              <Paragraph>
                <Text strong>技术特点：</Text>
              </Paragraph>
              <ul>
                <li>
                  <Text>使用CSS clip-path实现第三象限圆弧形状</Text>
                </li>
                <li>
                  <Text>通过transform: scale()实现半径扩散</Text>
                </li>
                <li>
                  <Text>以右上角为transform-origin确保正确的扩散中心</Text>
                </li>
                <li>
                  <Text>requestAnimationFrame确保动画流畅</Text>
                </li>
                <li>
                  <Text>contain属性优化渲染性能</Text>
                </li>
                <li>
                  <Text>支持高刷新率屏幕</Text>
                </li>
                <li>
                  <Text>优雅降级，在不支持的浏览器中正常切换主题</Text>
                </li>
              </ul>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ThemeTestPage;
