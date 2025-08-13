import React from 'react';
import { Breadcrumb as AntBreadcrumb } from 'antd';
import { HomeOutlined, RightOutlined } from '@ant-design/icons';
import { useLocation, Link, useParams } from 'react-router-dom';

const routeMap: Record<string, string> = {
  '/dashboard': '仪表板',
  '/deployments': '部署管理',
  '/deployments/history': '部署历史',
  '/deployments/config': '部署配置',
  '/projects': '项目管理',
  '/projects/list': '项目列表',
  '/projects/create': '新建项目',
  '/analytics': '数据分析',
  '/analytics/overview': '概览',
  '/analytics/reports': '报表',
  '/team': '团队管理',
  '/team/members': '成员管理',
  '/team/roles': '角色管理',
  '/logs': '日志中心',
  '/logs/realtime': '实时日志',
  '/logs/search': '日志搜索',
  '/settings': '系统设置',
  '/settings/general': '常规设置',
  '/settings/security': '安全设置',
};

// 动态路由映射
const dynamicRouteMap: Record<string, (params: any) => string> = {
  '/projects/:id': (params) => `项目详情`,
  '/projects/:id/edit': (params) => `编辑项目`,
  '/deployments/history/:id': (params) => `部署详情`,
};

const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const params = useParams();
  const pathSnippets = location.pathname.split('/').filter(i => i);

  const extraBreadcrumbItems = pathSnippets.map((_, index) => {
    const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
    
    // 检查是否是动态路由
    let name = routeMap[url];
    if (!name) {
      // 尝试匹配动态路由
      for (const [pattern, nameFn] of Object.entries(dynamicRouteMap)) {
        const patternParts = pattern.split('/').filter(i => i);
        const urlParts = url.split('/').filter(i => i);
        
        if (patternParts.length === urlParts.length) {
          let isMatch = true;
          for (let i = 0; i < patternParts.length; i++) {
            if (patternParts[i].startsWith(':')) {
              // 这是参数部分，跳过检查
              continue;
            }
            if (patternParts[i] !== urlParts[i]) {
              isMatch = false;
              break;
            }
          }
          if (isMatch) {
            name = nameFn(params);
            break;
          }
        }
      }
    }
    
    // 如果还是没有找到，使用路径片段作为名称
    if (!name) {
      name = pathSnippets[index];
    }
    
    return {
      key: url,
      title: index === pathSnippets.length - 1 ? (
        <span style={{ 
          color: 'var(--content-text)',
          fontWeight: '500'
        }}>
          {name}
        </span>
      ) : (
        <Link 
          to={url}
          style={{ 
            color: 'var(--content-text-secondary)',
            textDecoration: 'none',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--content-text)';
            e.currentTarget.style.transform = 'translateX(2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--content-text-secondary)';
            e.currentTarget.style.transform = 'translateX(0)';
          }}
        >
          {name}
        </Link>
      ),
    };
  });

  const breadcrumbItems = [
    {
      key: 'home',
      title: (
        <Link 
          to="/dashboard"
          style={{ 
            color: 'var(--content-text-secondary)',
            textDecoration: 'none',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--content-text)';
            e.currentTarget.style.transform = 'translateX(2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--content-text-secondary)';
            e.currentTarget.style.transform = 'translateX(0)';
          }}
        >
          <HomeOutlined style={{ marginRight: '4px' }} />
          首页
        </Link>
      ),
    },
    ...extraBreadcrumbItems,
  ];

  return (
    <AntBreadcrumb
      separator={<RightOutlined style={{ color: 'var(--content-text-secondary)' }} />}
      items={breadcrumbItems}
      style={{ 
        marginBottom: '16px',
        padding: '12px 16px',
        background: 'var(--content-glass-bg)',
        borderRadius: '8px',
        border: '1px solid var(--content-glass-border)',
        backdropFilter: 'blur(20px)'
      }}
    />
  );
};

export default Breadcrumb;
