import React, { useState } from 'react';
import { 
  Drawer, 
  Form, 
  Switch, 
  Typography, 
  Space, 
  Button,
  Card,
  message,
  ConfigProvider,
  theme,
  Row,
  Col
} from 'antd';
import {
  SettingOutlined,
  BgColorsOutlined,
  LayoutOutlined,
  BorderOutlined,
  ReloadOutlined,
  SunOutlined,
  MoonOutlined,
  MenuOutlined,
  AppstoreOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  FileTextOutlined,
  BulbOutlined,
  BulbFilled
} from '@ant-design/icons';
import { useSettings } from '../../contexts/SettingsContext';

const { Text } = Typography;

interface SettingsDrawerProps {
  visible: boolean;
  onClose: () => void;
}

const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ visible, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { settings, updateSettings, resetSettings } = useSettings();

  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      // 使用统一的设置上下文更新设置
      updateSettings(values);
      message.success('设置已保存');
      
      // 延迟关闭抽屉
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      message.error('保存设置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    resetSettings();
    form.setFieldsValue(settings);
    message.info('设置已重置为默认值');
  };

  // 获取Ant Design主题配置
  const getThemeConfig = () => {
    const algorithm = settings.theme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm;
    
    return {
      algorithm,
      token: {
        colorPrimary: settings.primaryColor,
        borderRadius: settings.borderRadius,
      },
    };
  };

  const colorPresets = [
    { name: '彩虹红', value: '#ff6b6b' },
    { name: '彩虹橙', value: '#ffa726' },
    { name: '彩虹黄', value: '#ffeb3b' },
    { name: '彩虹绿', value: '#4caf50' },
    { name: '彩虹蓝', value: '#2196f3' },
    { name: '彩虹靛', value: '#3f51b5' },
    { name: '彩虹紫', value: '#9c27b0' },
    { name: '彩虹粉', value: '#e91e63' },
  ];

  const borderRadiusOptions = [
    { value: 0, label: '方形', icon: (color: string) => <div style={{ width: '20px', height: '20px', backgroundColor: color, borderRadius: '0px' }} /> },
    { value: 4, label: '小圆角', icon: (color: string) => <div style={{ width: '20px', height: '20px', backgroundColor: color, borderRadius: '4px' }} /> },
    { value: 8, label: '圆角', icon: (color: string) => <div style={{ width: '20px', height: '20px', backgroundColor: color, borderRadius: '8px' }} /> },
    { value: 12, label: '大圆角', icon: (color: string) => <div style={{ width: '20px', height: '20px', backgroundColor: color, borderRadius: '12px' }} /> },
    { value: 20, label: '圆形', icon: (color: string) => <div style={{ width: '20px', height: '20px', backgroundColor: color, borderRadius: '50%' }} /> },
  ];

  const menuLayoutOptions = [
    { value: 'side', label: '侧边菜单', icon: <MenuOutlined />, desc: '传统侧边栏布局' },
    { value: 'double', label: '双列菜单', icon: <MenuOutlined />, desc: '双列侧边栏布局' },
    { value: 'top', label: '顶部菜单', icon: <AppstoreOutlined />, desc: '现代顶部导航布局' },
  ];

  const themeOptions = [
    { value: 'light', label: '浅色主题', icon: <SunOutlined />, desc: '明亮清爽' },
    { value: 'dark', label: '深色主题', icon: <MoonOutlined />, desc: '护眼舒适' },
    { value: 'auto', label: '跟随系统', icon: <SettingOutlined />, desc: '自动切换' },
  ];

  return (
    <ConfigProvider theme={getThemeConfig()}>
      <Drawer
        title={
          <Space>
            <SettingOutlined />
            <span>系统设置</span>
          </Space>
        }
        placement="right"
        width={500}
        open={visible}
        onClose={onClose}
        footer={
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleReset}
            >
              重置
            </Button>
            <Button 
              type="primary" 
              onClick={handleSave}
              loading={loading}
            >
              保存设置
            </Button>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={settings}
          onValuesChange={(changedValues) => {
            // 实时应用设置变化，但不包括主色调（因为主色调有特殊的处理逻辑）
            const { primaryColor, ...otherChanges } = changedValues;
            if (Object.keys(otherChanges).length > 0) {
              updateSettings(otherChanges);
            }
          }}
        >
          {/* 主题设置 */}
          <Card 
            size="small" 
            title={
              <Space>
                <BgColorsOutlined />
                <span>主题设置</span>
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Form.Item label="主题模式" name="theme">
              <Row gutter={[8, 8]}>
                {themeOptions.map(option => (
                  <Col span={8} key={option.value}>
                                                              <Card
                       size="small"
                       hoverable
                       className={`settings-card ${settings.theme === option.value ? 'selected' : ''}`}
                       style={{
                         textAlign: 'center',
                         cursor: 'pointer',
                         border: settings.theme === option.value ? `3px solid ${settings.primaryColor}` : '1px solid #d9d9d9',
                         background: settings.theme === option.value ? settings.primaryColor : 'transparent',
                         color: settings.theme === option.value ? 'white' : 'inherit'
                       }}
                       onClick={() => {
                                                   updateSettings({ theme: option.value as 'light' | 'dark' | 'auto' });
                         form.setFieldValue('theme', option.value);
                       }}
                     >
                        <div style={{ fontSize: '20px', marginBottom: '4px' }}>
                          {option.icon}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                          {option.label}
                        </div>
                        <div style={{ fontSize: '10px', opacity: 0.8 }}>
                          {option.desc}
                        </div>
                     </Card>
                  </Col>
                ))}
              </Row>
            </Form.Item>

            <Form.Item label="主色调" name="primaryColor">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {colorPresets.map(preset => (
                  <div
                    key={preset.value}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: preset.value,
                      cursor: 'pointer',
                      border: settings.primaryColor === preset.value 
                        ? `2px solid #fff` 
                        : `1px solid ${settings.primaryColor === preset.value ? '#fff' : '#d9d9d9'}`,
                      boxShadow: settings.primaryColor === preset.value 
                        ? `0 0 0 1px ${preset.value}` 
                        : 'none',
                      position: 'relative',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => {
                      updateSettings({ primaryColor: preset.value });
                      form.setFieldValue('primaryColor', preset.value);
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.boxShadow = `0 0 0 1px ${preset.value}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = settings.primaryColor === preset.value 
                        ? `0 0 0 1px ${preset.value}` 
                        : 'none';
                    }}
                  />
                ))}
                
                {/* 自定义颜色选择器 */}
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    border: settings.primaryColor !== colorPresets.find(p => p.value === settings.primaryColor)?.value 
                      ? `2px solid #fff` 
                      : `1px solid #d9d9d9`,
                    boxShadow: settings.primaryColor !== colorPresets.find(p => p.value === settings.primaryColor)?.value 
                      ? `0 0 0 1px ${settings.primaryColor}` 
                      : 'none',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    background: settings.primaryColor !== colorPresets.find(p => p.value === settings.primaryColor)?.value 
                      ? settings.primaryColor 
                      : 'linear-gradient(45deg, #ff6b6b, #ffa726, #ffeb3b, #4caf50, #2196f3, #3f51b5, #9c27b0, #e91e63)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    if (settings.primaryColor !== colorPresets.find(p => p.value === settings.primaryColor)?.value) {
                      e.currentTarget.style.boxShadow = `0 0 0 1px ${settings.primaryColor}`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = settings.primaryColor !== colorPresets.find(p => p.value === settings.primaryColor)?.value 
                      ? `0 0 0 1px ${settings.primaryColor}` 
                      : 'none';
                  }}
                >
                  <input
                    type="color"
                    value={settings.primaryColor !== colorPresets.find(p => p.value === settings.primaryColor)?.value ? settings.primaryColor : '#ff6b6b'}
                    onChange={(e) => {
                      updateSettings({ primaryColor: e.target.value });
                      form.setFieldValue('primaryColor', e.target.value);
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      padding: '0',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                      background: 'transparent',
                      position: 'absolute',
                      top: '0',
                      left: '0',
                      opacity: '0'
                    }}
                  />
                </div>
              </div>
            </Form.Item>

            <Form.Item label="圆角大小" name="borderRadius">
              <Row gutter={[8, 8]}>
                {borderRadiusOptions.map(option => (
                  <Col span={4.8} key={option.value}>
                    <Card
                      size="small"
                      hoverable
                      className={`settings-card ${settings.borderRadius === option.value ? 'selected' : ''}`}
                      style={{
                        textAlign: 'center',
                        cursor: 'pointer',
                        border: settings.borderRadius === option.value ? `3px solid ${settings.primaryColor}` : '1px solid #d9d9d9',
                        background: settings.borderRadius === option.value ? settings.primaryColor : 'transparent',
                        color: settings.borderRadius === option.value ? 'white' : 'inherit'
                      }}
                      onClick={() => {
                        updateSettings({ borderRadius: option.value });
                        form.setFieldValue('borderRadius', option.value);
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        marginBottom: '4px',
                        height: '24px'
                      }}>
                        {option.icon(settings.borderRadius === option.value ? '#fff' : '#d9d9d9')}
                      </div>
                      <div style={{ fontSize: '10px', fontWeight: 'bold' }}>
                        {option.label}
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Form.Item>
          </Card>

          {/* 布局设置 */}
          <Card 
            size="small" 
            title={
              <Space>
                <LayoutOutlined />
                <span>布局设置</span>
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Form.Item label="菜单布局" name="menuLayout">
              <Row gutter={[8, 8]}>
                {menuLayoutOptions.map(option => (
                  <Col span={12} key={option.value}>
                                                              <Card
                       size="small"
                       hoverable
                       className={`settings-card ${settings.menuLayout === option.value ? 'selected' : ''}`}
                       style={{
                         textAlign: 'center',
                         cursor: 'pointer',
                         border: settings.menuLayout === option.value ? `3px solid ${settings.primaryColor}` : '1px solid #d9d9d9',
                         background: settings.menuLayout === option.value ? settings.primaryColor : 'transparent',
                         color: settings.menuLayout === option.value ? 'white' : 'inherit'
                       }}
                       onClick={() => {
                                                   updateSettings({ menuLayout: option.value as 'side' | 'top' | 'double' });
                         form.setFieldValue('menuLayout', option.value);
                       }}
                     >
                        <div style={{ fontSize: '20px', marginBottom: '4px' }}>
                          {option.icon}
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                          {option.label}
                        </div>
                        <div style={{ fontSize: '10px', opacity: 0.8 }}>
                          {option.desc}
                        </div>
                     </Card>
                  </Col>
                ))}
              </Row>
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="紧凑模式" name="compactMode" valuePropName="checked">
                  <Switch 
                    checkedChildren={<Text style={{ fontSize: '10px' }}>紧凑</Text>}
                    unCheckedChildren={<Text style={{ fontSize: '10px' }}>宽松</Text>}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="启用动画" name="animationEnabled" valuePropName="checked">
                  <Switch 
                    checkedChildren={<PlayCircleOutlined />}
                    unCheckedChildren={<PauseCircleOutlined />}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="显示面包屑" name="showBreadcrumb" valuePropName="checked">
                  <Switch 
                    checkedChildren={<EyeOutlined />}
                    unCheckedChildren={<EyeInvisibleOutlined />}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="显示页脚" name="showFooter" valuePropName="checked">
                  <Switch 
                    checkedChildren={<FileTextOutlined />}
                    unCheckedChildren={<EyeInvisibleOutlined />}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          {/* 视觉效果 */}
          <Card 
            size="small" 
            title={
              <Space>
                <BorderOutlined />
                <span>视觉效果</span>
              </Space>
            }
            style={{ marginBottom: 16 }}
          >
            <Form.Item label="毛玻璃效果" name="glassEffect" valuePropName="checked">
              <Switch 
                checkedChildren={<BulbFilled />}
                unCheckedChildren={<BulbOutlined />}
              />
            </Form.Item>
          </Card>

                     {/* 预览区域 */}
           <Card 
             size="small" 
             title="效果预览"
             style={{ marginBottom: 16 }}
           >
             <div style={{ marginBottom: '12px' }}>
               <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                 主色调预览
               </div>
               <div style={{
                 width: '100%',
                 height: '40px',
                 background: `linear-gradient(135deg, ${settings.primaryColor} 0%, ${settings.primaryColor}dd 100%)`,
                 borderRadius: `${settings.borderRadius}px`,
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 color: 'white',
                 fontSize: '12px',
                 fontWeight: 'bold'
               }}>
                 {settings.primaryColor}
               </div>
             </div>

             <div style={{ marginBottom: '12px' }}>
               <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                 圆角效果预览
               </div>
               <Row gutter={[8, 8]}>
                 <Col span={8}>
                   <div style={{
                     height: '40px',
                     background: 'var(--primary-color)',
                     borderRadius: `${settings.borderRadius}px`,
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     color: 'white',
                     fontSize: '10px'
                   }}>
                     按钮
                   </div>
                 </Col>
                 <Col span={8}>
                   <div style={{
                     height: '40px',
                     background: 'var(--content-card-bg)',
                     border: '1px solid var(--content-card-border)',
                     borderRadius: `${settings.borderRadius}px`,
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     fontSize: '10px'
                   }}>
                     卡片
                   </div>
                 </Col>
                 <Col span={8}>
                   <div style={{
                     height: '40px',
                     background: 'var(--content-glass-bg)',
                     border: '1px solid var(--content-glass-border)',
                     borderRadius: `${settings.borderRadius}px`,
                     backdropFilter: settings.glassEffect ? 'blur(20px)' : 'none',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     fontSize: '10px'
                   }}>
                     毛玻璃
                   </div>
                 </Col>
               </Row>
             </div>

             <div style={{ marginBottom: '12px' }}>
               <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                 布局预览
               </div>
               <div style={{
                 height: '60px',
                 background: 'var(--content-card-bg)',
                 border: '1px solid var(--content-card-border)',
                 borderRadius: `${settings.borderRadius}px`,
                 padding: '8px',
                 position: 'relative'
               }}>
                 {settings.menuLayout === 'side' ? (
                   <>
                     <div style={{
                       position: 'absolute',
                       left: '8px',
                       top: '8px',
                       width: '20px',
                       height: '44px',
                       background: 'var(--primary-color)',
                       borderRadius: '4px'
                     }} />
                     <div style={{
                       position: 'absolute',
                       left: '36px',
                       top: '8px',
                       right: '8px',
                       height: '20px',
                       background: 'var(--border-color)',
                       borderRadius: '4px'
                     }} />
                     <div style={{
                       position: 'absolute',
                       left: '36px',
                       top: '32px',
                       right: '8px',
                       height: '20px',
                       background: 'var(--content-glass-bg)',
                       borderRadius: '4px'
                     }} />
                   </>
                 ) : (
                   <>
                     <div style={{
                       position: 'absolute',
                       left: '8px',
                       top: '8px',
                       right: '8px',
                       height: '20px',
                       background: 'var(--primary-color)',
                       borderRadius: '4px'
                     }} />
                     <div style={{
                       position: 'absolute',
                       left: '8px',
                       top: '32px',
                       right: '8px',
                       height: '20px',
                       background: 'var(--content-glass-bg)',
                       borderRadius: '4px'
                     }} />
                   </>
                 )}
               </div>
             </div>

             <div>
               <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                 紧凑模式预览
               </div>
               <div style={{
                 height: '40px',
                 background: 'var(--content-card-bg)',
                 border: '1px solid var(--content-card-border)',
                 borderRadius: `${settings.borderRadius}px`,
                 padding: settings.compactMode ? '4px 8px' : '8px 12px',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'space-between'
               }}>
                 <div style={{ fontSize: '10px' }}>内容区域</div>
                 <div style={{
                   width: '20px',
                   height: '20px',
                   background: 'var(--primary-color)',
                   borderRadius: '4px',
                   fontSize: '8px',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   color: 'white'
                 }}>
                   {settings.compactMode ? '紧凑' : '宽松'}
                 </div>
               </div>
             </div>
           </Card>
        </Form>
      </Drawer>
    </ConfigProvider>
  );
};

export default SettingsDrawer;
