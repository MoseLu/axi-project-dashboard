import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import MainLayout from './components/layout/MainLayout';
import DashboardPage from './pages/DashboardPage';
import DeploymentsPage from './pages/DeploymentsPage';
import DeploymentHistoryPage from './pages/deployments/DeploymentHistoryPage';
import DeploymentConfigPage from './pages/deployments/DeploymentConfigPage';
import ProjectListPage from './pages/projects/ProjectListPage';
import MonitoringPage from './pages/MonitoringPage';
import ProfilePage from './pages/ProfilePage';
import AccountSettingsPage from './pages/AccountSettingsPage';
import BreadcrumbTestPage from './pages/BreadcrumbTestPage';
import ThemeTestPage from './pages/ThemeTestPage';
import AvatarTestPage from './pages/AvatarTestPage';
import NotFoundPage from './pages/NotFoundPage';
import ComingSoonPage from './pages/ComingSoonPage';
import LoginPage3D from './pages/LoginPage3D';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ThemeTransitionManager from './components/theme/ThemeTransitionManager';
import { useSocket } from './hooks/useSocket';

const AppContent: React.FC = () => {
  const { settings } = useSettings();
  const { token } = useAuth();
  useSocket(token); // 初始化全局 socket 连接（无状态依赖）
  const [themeConfig, setThemeConfig] = useState(() => {
    return {
      algorithm: settings.theme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
      token: {
        colorPrimary: settings.primaryColor || '#1890ff',
        borderRadius: settings.borderRadius || 6,
      },
    };
  });

  useEffect(() => {
    setThemeConfig({
      algorithm: settings.theme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm,
      token: {
        colorPrimary: settings.primaryColor,
        borderRadius: settings.borderRadius,
      },
    });
  }, [settings.theme, settings.primaryColor, settings.borderRadius]);

  return (
    <ThemeTransitionManager>
      <ConfigProvider locale={zhCN} theme={themeConfig}>
        <AntApp>
          <Router basename={process.env.NODE_ENV === 'production' ? '/project-dashboard' : '/'}>
            <Routes>
            {/* 登录页面 - 不需要认证 */}
            <Route path="/login" element={
              <ProtectedRoute requireAuth={false}>
                <LoginPage3D />
              </ProtectedRoute>
            } />
            
            {/* 需要认证的路由 */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <MainLayout>
                  <DashboardPage />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            {/* 面包屑测试页面 */}
            <Route path="/breadcrumb-test" element={
              <ProtectedRoute>
                <MainLayout>
                  <BreadcrumbTestPage />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            {/* 主题切换测试页面 */}
            <Route path="/theme-test" element={
              <ProtectedRoute>
                <MainLayout>
                  <ThemeTestPage />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            {/* 头像测试页面 */}
            <Route path="/avatar-test" element={
              <ProtectedRoute>
                <MainLayout>
                  <AvatarTestPage />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            {/* 部署管理路由 */}
            <Route path="/deployments" element={
              <ProtectedRoute>
                <MainLayout>
                  <DeploymentsPage />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/deployments/history" element={
              <ProtectedRoute>
                <MainLayout>
                  <DeploymentHistoryPage />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/deployments/config" element={
              <ProtectedRoute>
                <MainLayout>
                  <DeploymentConfigPage />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            {/* 项目管理路由 */}
            <Route path="/projects" element={
              <ProtectedRoute>
                <MainLayout>
                  <ProjectListPage />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            {/* 监控中心 */}
            <Route path="/monitoring" element={
              <ProtectedRoute>
                <MainLayout>
                  <MonitoringPage />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/projects/list" element={
              <ProtectedRoute>
                <MainLayout>
                  <ProjectListPage />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            {/* 个人资料路由 */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <MainLayout>
                  <ProfilePage />
                </MainLayout>
              </ProtectedRoute>
            } />
            
            {/* 账户设置路由 */}
            <Route path="/account-settings" element={
              <ProtectedRoute>
                <MainLayout>
                  <AccountSettingsPage />
                </MainLayout>
              </ProtectedRoute>
            } />
          
          {/* 其他功能页面 */}
          <Route path="/analytics" element={
            <ProtectedRoute>
              <MainLayout>
                <ComingSoonPage 
                  title="数据分析" 
                  description="全面的数据分析平台，提供详细的部署统计、性能监控和趋势分析。"
                  features={[
                    "部署成功率统计",
                    "性能监控和告警",
                    "趋势分析和预测",
                    "自定义报表生成",
                    "数据导出和分享"
                  ]}
                  progress={45}
                  estimatedTime="预计3-4周内完成"
                />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/team" element={
            <ProtectedRoute>
              <MainLayout>
                <ComingSoonPage 
                  title="团队管理" 
                  description="完善的团队管理系统，支持成员管理、角色分配和权限控制。"
                  features={[
                    "团队成员管理",
                    "角色和权限分配",
                    "团队协作工具",
                    "活动日志记录",
                    "安全审计功能"
                  ]}
                  progress={30}
                  estimatedTime="预计2-3周内完成"
                />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/logs" element={
            <ProtectedRoute>
              <MainLayout>
                <ComingSoonPage 
                  title="日志中心" 
                  description="集中化的日志管理系统，提供实时日志查看、搜索和分析功能。"
                  features={[
                    "实时日志流监控",
                    "高级搜索和过滤",
                    "日志分析和告警",
                    "日志存储和归档",
                    "多格式日志支持"
                  ]}
                  progress={60}
                  estimatedTime="预计2周内完成"
                />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <MainLayout>
                <ComingSoonPage 
                  title="系统设置" 
                  description="灵活的系统配置中心，支持个性化设置和系统参数调整。"
                  features={[
                    "系统参数配置",
                    "用户偏好设置",
                    "通知规则配置",
                    "安全策略设置",
                    "备份和恢复功能"
                  ]}
                  progress={85}
                  estimatedTime="预计1周内完成"
                />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="*" element={
            <ProtectedRoute>
              <MainLayout>
                <NotFoundPage />
              </MainLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
        </AntApp>
    </ConfigProvider>
    </ThemeTransitionManager>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </AuthProvider>
  );
};

export default App;