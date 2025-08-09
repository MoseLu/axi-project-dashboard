import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp, Spin } from 'antd';
import { Provider } from 'react-redux';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';

import { store } from '@/store/store';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { useTheme } from '@/hooks/useTheme';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { GlobalStyles } from '@/styles/GlobalStyles';

// 懒加载页面组件
const Layout = React.lazy(() => import('@/components/Layout'));
const LoginPage = React.lazy(() => import('@/pages/LoginPage'));
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const ProjectList = React.lazy(() => import('@/pages/ProjectList'));
const ProjectDetail = React.lazy(() => import('@/pages/ProjectDetail'));
const DeploymentList = React.lazy(() => import('@/pages/DeploymentList'));
const DeploymentDetail = React.lazy(() => import('@/pages/DeploymentDetail'));
const MonitoringPage = React.lazy(() => import('@/pages/MonitoringPage'));
const SettingsPage = React.lazy(() => import('@/pages/SettingsPage'));
const UserManagement = React.lazy(() => import('@/pages/UserManagement'));
const NotFoundPage = React.lazy(() => import('@/pages/NotFoundPage'));

// 配置 dayjs
dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.locale('zh-cn');

// 保护路由组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// 主应用组件
const AppContent: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { isAuthenticated } = useAuth();
  
  // 初始化 Socket 连接
  useSocket();

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: isDark ? 'dark' : 'default',
        token: {
          colorPrimary: theme.primaryColor,
          borderRadius: 6,
          wireframe: false,
        },
        components: {
          Layout: {
            headerBg: theme.headerBg,
            siderBg: theme.siderBg,
            bodyBg: theme.bodyBg,
          },
          Menu: {
            darkItemBg: theme.menuDarkBg,
            darkSubMenuItemBg: theme.menuDarkBg,
          },
        },
      }}
    >
      <AntApp>
        <GlobalStyles />
        <Router>
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                {/* 登录页面 */}
                <Route
                  path="/login"
                  element={
                    isAuthenticated ? (
                      <Navigate to="/dashboard" replace />
                    ) : (
                      <LoginPage />
                    )
                  }
                />

                {/* 受保护的路由 */}
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Routes>
                          {/* 仪表板首页 */}
                          <Route path="/" element={<Navigate to="/dashboard" replace />} />
                          <Route path="/dashboard" element={<Dashboard />} />

                          {/* 项目管理 */}
                          <Route path="/projects" element={<ProjectList />} />
                          <Route path="/projects/:projectId" element={<ProjectDetail />} />

                          {/* 部署管理 */}
                          <Route path="/deployments" element={<DeploymentList />} />
                          <Route
                            path="/deployments/:deploymentId"
                            element={<DeploymentDetail />}
                          />

                          {/* 监控页面 */}
                          <Route path="/monitoring" element={<MonitoringPage />} />

                          {/* 用户管理 */}
                          <Route path="/users" element={<UserManagement />} />

                          {/* 设置页面 */}
                          <Route path="/settings" element={<SettingsPage />} />

                          {/* 404 页面 */}
                          <Route path="*" element={<NotFoundPage />} />
                        </Routes>
                      </Layout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </Router>
      </AntApp>
    </ConfigProvider>
  );
};

// 根应用组件
const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

export default App;
