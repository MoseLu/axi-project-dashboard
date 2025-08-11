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
    return status === 'success' ? '#10b981' : '#ef4444';
  };

  const getStatusText = (status: string) => {
    return status === 'success' ? '成功' : '失败';
  };

  const getStatusIcon = (status: string) => {
    return status === 'success' ? '✅' : '❌';
  };

  const successRate = metrics.totalDeployments > 0 
    ? Math.round((metrics.successfulDeployments / metrics.totalDeployments) * 100) 
    : 100;

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        fontSize: '18px',
        color: '#fff'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div className="pulse" style={{ fontSize: '48px' }}>⏳</div>
          <div>正在加载数据...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in-up">
      {/* 统计卡片区域 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '24px',
        marginBottom: '40px'
      }}>
        {/* 总部署次数卡片 */}
        <div className="glass-effect card-shadow" style={{ 
          padding: '32px 24px',
          borderRadius: '16px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '50%',
            opacity: 0.1
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              📊
            </div>
            <div>
              <h3 style={{ 
                color: '#fff', 
                margin: '0 0 8px 0',
                fontSize: '16px',
                fontWeight: '500',
                opacity: 0.9
              }}>
                总部署次数
              </h3>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: '700',
                color: '#fff',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                {metrics.totalDeployments}
              </div>
            </div>
          </div>
        </div>
        
        {/* 成功部署卡片 */}
        <div className="glass-effect card-shadow" style={{ 
          padding: '32px 24px',
          borderRadius: '16px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '50%',
            opacity: 0.1
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              ✅
            </div>
            <div>
              <h3 style={{ 
                color: '#fff', 
                margin: '0 0 8px 0',
                fontSize: '16px',
                fontWeight: '500',
                opacity: 0.9
              }}>
                成功部署
              </h3>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: '700',
                color: '#fff',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                {metrics.successfulDeployments}
              </div>
            </div>
          </div>
        </div>
        
        {/* 失败部署卡片 */}
        <div className="glass-effect card-shadow" style={{ 
          padding: '32px 24px',
          borderRadius: '16px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            borderRadius: '50%',
            opacity: 0.1
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              ❌
            </div>
            <div>
              <h3 style={{ 
                color: '#fff', 
                margin: '0 0 8px 0',
                fontSize: '16px',
                fontWeight: '500',
                opacity: 0.9
              }}>
                失败部署
              </h3>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: '700',
                color: '#fff',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                {metrics.failedDeployments}
              </div>
            </div>
          </div>
        </div>
        
        {/* 成功率卡片 */}
        <div className="glass-effect card-shadow" style={{ 
          padding: '32px 24px',
          borderRadius: '16px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            borderRadius: '50%',
            opacity: 0.1
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              📈
            </div>
            <div>
              <h3 style={{ 
                color: '#fff', 
                margin: '0 0 8px 0',
                fontSize: '16px',
                fontWeight: '500',
                opacity: 0.9
              }}>
                成功率
              </h3>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: '700',
                color: '#fff',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                {successRate}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 最近部署表格 */}
      <div className="glass-effect card-shadow slide-in-left" style={{ 
        padding: '32px',
        borderRadius: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px'
          }}>
            📋
          </div>
          <h3 style={{ 
            margin: 0, 
            color: '#fff',
            fontSize: '20px',
            fontWeight: '600'
          }}>
            最近部署记录
          </h3>
        </div>
        
        {deployments.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              color: '#fff'
            }}>
              <thead>
                <tr style={{ 
                  borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.05)'
                }}>
                  <th style={{ 
                    padding: '16px 12px', 
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '14px',
                    opacity: 0.9
                  }}>
                    项目名称
                  </th>
                  <th style={{ 
                    padding: '16px 12px', 
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '14px',
                    opacity: 0.9
                  }}>
                    部署状态
                  </th>
                  <th style={{ 
                    padding: '16px 12px', 
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '14px',
                    opacity: 0.9
                  }}>
                    耗时
                  </th>
                  <th style={{ 
                    padding: '16px 12px', 
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '14px',
                    opacity: 0.9
                  }}>
                    部署时间
                  </th>
                </tr>
              </thead>
              <tbody>
                {deployments.map((deployment, index) => (
                  <tr key={deployment.id} style={{ 
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    transition: 'all 0.2s ease',
                    animationDelay: `${index * 0.1}s`
                  }} className="slide-in-left">
                    <td style={{ 
                      padding: '16px 12px',
                      fontWeight: '500'
                    }}>
                      {deployment.project}
                    </td>
                    <td style={{ padding: '16px 12px' }}>
                      <span style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        background: deployment.status === 'success' 
                          ? 'rgba(16, 185, 129, 0.2)' 
                          : 'rgba(239, 68, 68, 0.2)',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '500',
                        border: `1px solid ${deployment.status === 'success' 
                          ? 'rgba(16, 185, 129, 0.3)' 
                          : 'rgba(239, 68, 68, 0.3)'}`
                      }}>
                        {getStatusIcon(deployment.status)}
                        {getStatusText(deployment.status)}
                      </span>
                    </td>
                    <td style={{ 
                      padding: '16px 12px',
                      opacity: 0.8
                    }}>
                      {deployment.duration > 0 ? `${deployment.duration}s` : '-'}
                    </td>
                    <td style={{ 
                      padding: '16px 12px',
                      opacity: 0.8,
                      fontSize: '13px'
                    }}>
                      {formatTime(deployment.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            color: 'rgba(255, 255, 255, 0.6)', 
            padding: '60px 0',
            fontSize: '16px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <div>暂无部署记录</div>
            <div style={{ 
              fontSize: '14px', 
              marginTop: '8px',
              opacity: 0.7
            }}>
              部署记录将在这里显示
            </div>
          </div>
        )}
      </div>

      {/* 底部信息 */}
      <div style={{
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '14px',
        marginTop: '40px'
      }}>
        <div style={{ marginBottom: '8px' }}>
          🔄 数据每30秒自动刷新
        </div>
        <div>
          © 2024 AXI Project Dashboard - 智能部署监控系统
        </div>
      </div>
    </div>
  );
};

export default Dashboard;