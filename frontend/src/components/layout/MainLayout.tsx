import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Badge, Dropdown, Avatar, Space, theme } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  SunOutlined,
  MoonOutlined,
  SettingOutlined,
  UserOutlined,
  DashboardOutlined,
  DeploymentUnitOutlined,
  ProjectOutlined,
  TeamOutlined,
  SettingOutlined as SettingIcon,
  LogoutOutlined,
  UserOutlined as UserIcon,
  BarChartOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { buildStaticUrl } from '../../config/env';
import SettingsDrawer from '../settings/SettingsDrawer';
import Breadcrumb from './Breadcrumb';

const { Header, Sider, Content } = Layout;

// 功能图标组件 - 避免重复渲染
const HeaderFunctionButtons: React.FC = () => {
  const { updateSettings, getCurrentDisplayTheme } = useSettings();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [settingsVisible, setSettingsVisible] = useState(false);

  const handleThemeToggle = () => {
    const currentTheme = getCurrentDisplayTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    updateSettings({ theme: newTheme });
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserIcon />,
      label: '个人资料',
    },
    {
      key: 'settings',
      icon: <SettingIcon />,
      label: '设置',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
    },
  ];

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout();
    } else if (key === 'settings') {
      navigate('/account-settings');
    } else if (key === 'profile') {
      navigate('/profile');
    }
  };

  return (
    <>
      <Space size="middle">
        {/* 通知图标 */}
        <Badge count={5} size="small">
          <Button
            type="text"
            icon={<BellOutlined />}
            className="header-button"
            style={{
              fontSize: '12px',
              transition: 'all 0.3s ease',
              borderRadius: '3px',
              padding: '2px 4px',
              height: '28px',
              width: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--header-border)',
              background: 'rgba(255, 255, 255, 0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.background = 'var(--header-bg-hover)';
              e.currentTarget.style.borderColor = 'var(--header-icon-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'var(--header-border)';
            }}
          />
        </Badge>
        
        {/* 主题切换图标 */}
        <Button
          type="text"
          icon={getCurrentDisplayTheme() === 'dark' ? <SunOutlined /> : <MoonOutlined />}
          onClick={handleThemeToggle}
          className="header-button"
          style={{
            fontSize: '12px',
            transition: 'all 0.3s ease',
            borderRadius: '3px',
            padding: '2px 4px',
            height: '28px',
            width: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--header-border)',
            background: 'rgba(255, 255, 255, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.background = 'var(--header-bg-hover)';
            e.currentTarget.style.borderColor = 'var(--header-icon-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.borderColor = 'var(--header-border)';
          }}
        />
        
        {/* 设置图标 */}
        <Button
          type="text"
          icon={<SettingOutlined />}
          onClick={() => setSettingsVisible(true)}
          className="header-button"
          style={{
            fontSize: '12px',
            transition: 'all 0.3s ease',
            borderRadius: '3px',
            padding: '2px 4px',
            height: '28px',
            width: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--header-border)',
            background: 'rgba(255, 255, 255, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.background = 'var(--header-bg-hover)';
            e.currentTarget.style.borderColor = 'var(--header-icon-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.borderColor = 'var(--header-border)';
          }}
        />
        
        {/* 用户头像 */}
        <Dropdown
          menu={{
            items: userMenuItems,
            onClick: handleUserMenuClick,
          }}
          placement="bottomRight"
        >
          <Button
            type="text"
            className="user-menu-button"
            style={{
              height: '40px',
              padding: '4px 8px',
              borderRadius: '8px',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              background: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.02)';
              e.currentTarget.style.background = 'var(--header-bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Avatar 
              size={32}
              src={user?.avatar_url ? buildStaticUrl(user.avatar_url) : undefined}
              icon={<UserOutlined />}
              onError={() => {
                console.error('导航栏头像加载失败:', user?.avatar_url);
                return false;
              }}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: '2px solid rgba(255,255,255,0.2)',
                flexShrink: 0
              }}
            />
            <span className="user-text" style={{
              fontSize: '14px',
              fontWeight: '500',
              color: 'var(--header-text)',
              whiteSpace: 'nowrap'
            }}>
              {user?.username || '用户'}
            </span>
          </Button>
        </Dropdown>
      </Space>
      
      {/* 设置抽屉 */}
      <SettingsDrawer 
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
      />
    </>
  );
};

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [secondSiderCollapsed] = useState(false);
  const [selectedMainMenu, setSelectedMainMenu] = useState<string>('');
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSettings();
  const {
    token: { borderRadiusLG },
  } = theme.useToken();

  // 主菜单项（用于双列布局）
  const mainMenuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: '仪表板',
    },
    {
      key: 'deployments',
      icon: <DeploymentUnitOutlined />,
      label: '部署管理',
    },
    {
      key: 'projects',
      icon: <ProjectOutlined />,
      label: '项目管理',
    },
    {
      key: 'analytics',
      icon: <BarChartOutlined />,
      label: '数据分析',
    },
    {
      key: 'team',
      icon: <TeamOutlined />,
      label: '团队管理',
    },
    {
      key: 'logs',
      icon: <FileTextOutlined />,
      label: '日志中心',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
  ];

  // 子菜单项（用于双列布局）
  const subMenuItems = {
    dashboard: [
      {
        key: '/dashboard',
        label: '仪表板概览',
      },
    ],
    deployments: [
      {
        key: '/deployments',
        label: '部署概览',
      },
      {
        key: '/deployments/history',
        label: '部署历史',
      },
      {
        key: '/deployments/config',
        label: '部署配置',
      },
    ],
    projects: [
      {
        key: '/projects',
        label: '项目列表',
      },
      {
        key: '/projects/list',
        label: '所有项目',
      },
    ],
    analytics: [
      {
        key: '/analytics',
        label: '数据分析',
      },
    ],
    team: [
      {
        key: '/team',
        label: '团队管理',
      },
    ],
    logs: [
      {
        key: '/logs',
        label: '日志中心',
      },
    ],
    settings: [
      {
        key: '/settings',
        label: '系统设置',
      },
    ],
  };

  // 传统菜单项（用于单列布局）
  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '仪表板',
    },
    {
      key: 'deployments',
      icon: <DeploymentUnitOutlined />,
      label: '部署管理',
      children: [
        {
          key: '/deployments',
          label: '部署概览',
        },
        {
          key: '/deployments/history',
          label: '部署历史',
        },
        {
          key: '/deployments/config',
          label: '部署配置',
        },
      ],
    },
    {
      key: 'projects',
      icon: <ProjectOutlined />,
      label: '项目管理',
      children: [
        {
          key: '/projects',
          label: '项目列表',
        },
        {
          key: '/projects/list',
          label: '所有项目',
        },
      ],
    },
    {
      key: '/analytics',
      icon: <BarChartOutlined />,
      label: '数据分析',
    },
    {
      key: '/team',
      icon: <TeamOutlined />,
      label: '团队管理',
    },
    {
      key: '/logs',
      icon: <FileTextOutlined />,
      label: '日志中心',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
  ];

  // const userMenuItems = [
  //   {
  //     key: 'profile',
  //     icon: <UserOutlined />,
  //     label: '个人资料',
  //   },
  //   {
  //     key: 'settings',
  //     icon: <SettingOutlined />,
  //     label: '账户设置',
  //   },
  //   {
  //     type: 'divider' as const,
  //   },
  //   {
  //     key: 'logout',
  //     icon: <LogoutOutlined />,
  //     label: '退出登录',
  //   },
  // ];

  const handleMenuClick = ({ key }: { key: string }) => {
    // 只处理实际的路由路径，忽略父级菜单的key
    if (key.startsWith('/')) {
      navigate(key);
    }
    // 如果是父级菜单的key，不进行导航，只展开/收起子菜单
  };

  const handleMainMenuClick = ({ key }: { key: string }) => {
    setSelectedMainMenu(key);
    // 如果子菜单有项目，自动导航到第一个子菜单
    const subItems = subMenuItems[key as keyof typeof subMenuItems];
    if (subItems && subItems.length > 0) {
      navigate(subItems[0].key);
    }
  };

  const handleSubMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };



  // 根据当前路径确定选中的主菜单
  useEffect(() => {
    if (settings.menuLayout === 'double') {
      const currentPath = location.pathname;
      // 查找当前路径对应的主菜单
      for (const [mainKey, subItems] of Object.entries(subMenuItems)) {
        if (subItems.some(item => item.key === currentPath)) {
          setSelectedMainMenu(mainKey);
          break;
        }
      }
      // 如果没有找到匹配的子菜单，默认选择dashboard
      if (!selectedMainMenu) {
        setSelectedMainMenu('dashboard');
      }
    }
  }, [location.pathname, settings.menuLayout]);

  return (
    <Layout style={{ 
      minHeight: '100vh',
      background: 'var(--gradient-bg)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* 背景装饰 */}
      <div className="decoration-element" style={{
        position: 'fixed',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        animation: 'float 20s linear infinite',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      
      <div className="decoration-element" style={{
        position: 'fixed',
        top: '10%',
        right: '10%',
        width: '200px',
        height: '200px',
        animation: 'pulse 4s ease-in-out infinite',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div className="decoration-element" style={{
        position: 'fixed',
        bottom: '20%',
        left: '5%',
        width: '150px',
        height: '150px',
        animation: 'float 8s ease-in-out infinite reverse',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      {settings.menuLayout === 'side' && (
        <Sider 
          trigger={null} 
          collapsible 
          collapsed={collapsed}
          width={256}
          collapsedWidth={80}
          style={{
            background: 'var(--sider-bg)',
            backdropFilter: 'blur(20px)',
            borderRight: '1px solid var(--sider-border)',
            boxShadow: '2px 0 8px 0 rgba(0,0,0,0.1)',
          }}
        >
        <div className="sider-header">
          <h2 className={`sider-title ${collapsed ? 'sider-title-collapsed' : 'sider-title-expanded'}`}>
            {collapsed ? 'AXI' : 'AXI项目看板'}
          </h2>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={['deployments', 'projects']}
          items={menuItems}
          onClick={handleMenuClick}
          inlineCollapsed={collapsed}
          style={{ 
            borderRight: 0,
            background: 'transparent',
            overflow: 'hidden',
            height: 'calc(100vh - 64px)'
          }}
          theme={settings.theme === 'dark' ? 'dark' : 'light'}
                  />
        </Sider>
      )}

      {settings.menuLayout === 'double' && (
        <>
          {/* 第一列：主菜单 */}
          <Sider 
            trigger={null} 
            collapsible 
            collapsed={collapsed}
            width={64}
            collapsedWidth={64}
            style={{
              background: 'var(--sider-bg)',
              backdropFilter: 'blur(20px)',
              borderRight: '1px solid var(--sider-border)',
              boxShadow: '2px 0 8px 0 rgba(0,0,0,0.1)',
              flexShrink: 0
            }}
          >
            <div className="sider-header">
              <h2 className="sider-title sider-title-collapsed">
                AXI
              </h2>
            </div>
            <Menu
              mode="inline"
              selectedKeys={[selectedMainMenu]}
              items={mainMenuItems}
              onClick={handleMainMenuClick}
              inlineCollapsed={true}
              style={{ 
                borderRight: 0,
                background: 'transparent',
                overflow: 'hidden',
                height: 'calc(100vh - 64px)'
              }}
              theme={settings.theme === 'dark' ? 'dark' : 'light'}
            />
          </Sider>

          {/* 第二列：子菜单 */}
          {selectedMainMenu && (
            <Sider 
              trigger={null} 
              collapsible 
              collapsed={secondSiderCollapsed}
              width={180}
              collapsedWidth={0}
              style={{
                background: 'var(--sider-bg)',
                backdropFilter: 'blur(20px)',
                borderRight: '1px solid var(--sider-border)',
                boxShadow: '2px 0 8px 0 rgba(0,0,0,0.1)',
                flexShrink: 0
              }}
            >
              <div className="sider-header">
                <h2 className="sider-title sider-title-expanded">
                  {mainMenuItems.find(item => item.key === selectedMainMenu)?.label}
                </h2>
              </div>
              <Menu
                mode="inline"
                selectedKeys={[location.pathname]}
                items={subMenuItems[selectedMainMenu as keyof typeof subMenuItems] || []}
                onClick={handleSubMenuClick}
                style={{ 
                  borderRight: 0,
                  background: 'transparent',
                  overflow: 'hidden',
                  height: 'calc(100vh - 64px)'
                }}
                theme={settings.theme === 'dark' ? 'dark' : 'light'}
              />
            </Sider>
          )}
        </>
      )}
      <Layout style={{ 
        minWidth: 0,
        maxWidth: '100%',
        overflow: 'hidden'
      }}>
        <Header style={{ 
          height: '64px',
          padding: '0 24px', 
          background: 'var(--header-bg)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--header-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: (settings.menuLayout === 'side' || settings.menuLayout === 'double') ? 'space-between' : 'flex-start',
          boxShadow: 'var(--header-shadow)'
        }}>
          {(settings.menuLayout === 'side' || settings.menuLayout === 'double') ? (
            // 侧边菜单布局或双列菜单布局
            <>
              <Space size="middle">
                <Button
                  type="text"
                  icon={React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined)}
                  onClick={() => setCollapsed(!collapsed)}
                  className="header-button sider-toggle"
                  style={{
                    fontSize: '12px',
                    transition: 'all 0.3s ease',
                    borderRadius: '3px',
                    padding: '2px 4px',
                    height: '28px',
                    width: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--header-border)',
                    background: 'rgba(255, 255, 255, 0.1)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.background = 'var(--header-bg-hover)';
                    e.currentTarget.style.borderColor = 'var(--header-icon-hover)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'var(--header-border)';
                  }}
                />
                <span className="header-text" style={{ 
                  fontSize: '16px', 
                  fontWeight: '500',
                  color: 'var(--header-text)'
                }}>
                  {settings.menuLayout === 'double' 
                    ? (subMenuItems[selectedMainMenu as keyof typeof subMenuItems]?.find(item => item.key === location.pathname)?.label || '仪表板')
                    : (menuItems.find(item => item.key === location.pathname)?.label || '仪表板')
                  }
                </span>
              </Space>
              
              {/* 侧边菜单和双列菜单的功能图标 */}
              <HeaderFunctionButtons />
            </>
          ) : (
            // 顶部菜单布局
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              width: '100%',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="header-text" style={{ 
                  fontSize: '18px', 
                  fontWeight: '600',
                  color: 'var(--header-text)',
                  marginRight: '16px'
                }}>
                  AXI项目看板
                </span>
                <Menu
                  mode="horizontal"
                  selectedKeys={[location.pathname]}
                  items={menuItems}
                  onClick={handleMenuClick}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--header-text)',
                    flex: 1
                  }}
                  theme={settings.theme === 'dark' ? 'dark' : 'light'}
                />
              </div>
              
                        {/* 顶部菜单的功能图标 */}
          <HeaderFunctionButtons />
        </div>
      )}
        </Header>
        <Content
          style={{
            margin: (settings.menuLayout === 'side' || settings.menuLayout === 'double') ? '24px' : '24px 24px 24px 24px',
            padding: 0,
            minHeight: 280,
            background: 'transparent',
            borderRadius: borderRadiusLG,
            overflow: 'visible',
            maxWidth: '100%',
            boxSizing: 'border-box'
          }}
        >
          {settings.showBreadcrumb && <Breadcrumb />}
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
