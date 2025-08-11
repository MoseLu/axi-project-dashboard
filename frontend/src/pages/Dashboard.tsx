import React, { useState, useEffect } from 'react';

interface Deployment {
  id: number;
  project: string;
  status: 'success' | 'failed';
  duration: number;
  timestamp: string;
  createdAt: string;
}

interface Metrics {
  totalDeployments: number;
  successfulDeployments: number;
  failedDeployments: number;
  averageDeploymentTime: number;
}

const Dashboard: React.FC = () => {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    totalDeployments: 0,
    successfulDeployments: 0,
    failedDeployments: 0,
    averageDeploymentTime: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [deploymentsRes, metricsRes] = await Promise.all([
        fetch('/api/deployments'),
        fetch('/api/metrics')
      ]);
      
      if (deploymentsRes.ok) {
        const deploymentsData = await deploymentsRes.json();
        setDeployments(deploymentsData.data || []);
      }
      
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData.data || {
          totalDeployments: 0,
          successfulDeployments: 0,
          failedDeployments: 0,
          averageDeploymentTime: 0
        });
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // 每30秒刷新一次数据
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  const getStatusColor = (status: string) => {
    return status === 'success' ? '#52c41a' : '#ff4d4f';
  };

  const getStatusText = (status: string) => {
    return status === 'success' ? '成功' : '失败';
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px' }}>加载中...</div>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>项目概览</h2>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          padding: '20px', 
          background: '#fff', 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: '#52c41a', margin: '0 0 10px 0' }}>总部署次数</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{metrics.totalDeployments}</div>
        </div>
        
        <div style={{ 
          padding: '20px', 
          background: '#fff', 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: '#1890ff', margin: '0 0 10px 0' }}>成功部署</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{metrics.successfulDeployments}</div>
        </div>
        
        <div style={{ 
          padding: '20px', 
          background: '#fff', 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: '#ff4d4f', margin: '0 0 10px 0' }}>失败部署</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{metrics.failedDeployments}</div>
        </div>
        
        <div style={{ 
          padding: '20px', 
          background: '#fff', 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: '#fa8c16', margin: '0 0 10px 0' }}>成功率</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {metrics.totalDeployments > 0 
              ? Math.round((metrics.successfulDeployments / metrics.totalDeployments) * 100) 
              : 100}%
          </div>
        </div>
      </div>

      <div style={{ 
        padding: '20px', 
        background: '#fff', 
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3>最近部署</h3>
        {deployments.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>项目</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>状态</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>耗时</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>时间</th>
                </tr>
              </thead>
              <tbody>
                {deployments.map((deployment) => (
                  <tr key={deployment.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px' }}>{deployment.project}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        color: getStatusColor(deployment.status),
                        fontWeight: 'bold'
                      }}>
                        {getStatusText(deployment.status)}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {deployment.duration > 0 ? `${deployment.duration}s` : '-'}
                    </td>
                    <td style={{ padding: '12px' }}>{formatTime(deployment.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            color: '#999', 
            padding: '40px 0' 
          }}>
            暂无部署记录
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;