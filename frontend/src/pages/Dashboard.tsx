import React, { useState, useEffect } from 'react';

interface Deployment {
  id: number;
  uuid: string;
  project_name: string;
  repository: string;
  branch: string;
  commit_hash: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  start_time?: string;
  end_time?: string;
  duration: number;
  triggered_by?: string;
  trigger_type: 'push' | 'manual' | 'schedule';
  logs?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

interface Metrics {
  totalDeployments: number;
  successfulDeployments: number;
  failedDeployments: number;
  averageDeploymentTime: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
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
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [filterProject, setFilterProject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchData = async () => {
    try {
      const [deploymentsRes, metricsRes] = await Promise.all([
        fetch(`/project-dashboard/api/deployments?page=${pagination.page}&limit=${pagination.limit}&sortBy=${sortBy}&sortOrder=${sortOrder}${filterProject ? `&project=${filterProject}` : ''}${filterStatus ? `&status=${filterStatus}` : ''}`),
        fetch('/project-dashboard/api/metrics')
      ]);
      
      if (deploymentsRes.ok) {
        const deploymentsData = await deploymentsRes.json();
        setDeployments(deploymentsData.data || []);
        setPagination(deploymentsData.pagination || pagination);
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
  }, [pagination.page, pagination.limit, sortBy, sortOrder, filterProject, filterStatus]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  const getDeploymentTime = (deployment: Deployment) => {
    return deployment.end_time || deployment.start_time || deployment.created_at;
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success': return '成功';
      case 'failed': return '失败';
      case 'running': return '进行中';
      case 'pending': return '等待中';
      case 'cancelled': return '已取消';
      default: return '未知';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'failed': return '❌';
      case 'running': return '🔄';
      case 'pending': return '⏳';
      case 'cancelled': return '🚫';
      default: return '❓';
    }
  };

  const successRate = metrics.totalDeployments > 0 
    ? Math.round((metrics.successfulDeployments / metrics.totalDeployments) * 100) 
    : 100;

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('DESC');
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev: Pagination) => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = () => {
    setPagination((prev: Pagination) => ({ ...prev, page: 1 }));
  };

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
    <div className="fade-in-up" style={{ padding: '24px' }}>
      {/* 统计卡片区域 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px',
        marginBottom: '32px'
      }}>
        {/* 总部署次数卡片 */}
        <div className="glass-effect card-shadow" style={{ 
          padding: '20px',
          borderRadius: '12px',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '120px'
        }}>
          <div style={{
            position: 'absolute',
            top: '-15px',
            right: '-15px',
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
            borderRadius: '50%',
            opacity: 0.1
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}>
              📊
            </div>
            <div>
              <h3 style={{ 
                color: '#fff', 
                margin: '0 0 6px 0',
                fontSize: '14px',
                fontWeight: '500',
                opacity: 0.9
              }}>
                总部署次数
              </h3>
              <div style={{ 
                fontSize: '24px', 
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
          padding: '20px',
          borderRadius: '12px',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '120px'
        }}>
          <div style={{
            position: 'absolute',
            top: '-15px',
            right: '-15px',
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            borderRadius: '50%',
            opacity: 0.1
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
            }}>
              ✅
            </div>
            <div>
              <h3 style={{ 
                color: '#fff', 
                margin: '0 0 6px 0',
                fontSize: '14px',
                fontWeight: '500',
                opacity: 0.9
              }}>
                成功部署
              </h3>
              <div style={{ 
                fontSize: '24px', 
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
          padding: '20px',
          borderRadius: '12px',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '120px'
        }}>
          <div style={{
            position: 'absolute',
            top: '-15px',
            right: '-15px',
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            borderRadius: '50%',
            opacity: 0.1
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
            }}>
              ❌
            </div>
            <div>
              <h3 style={{ 
                color: '#fff', 
                margin: '0 0 6px 0',
                fontSize: '14px',
                fontWeight: '500',
                opacity: 0.9
              }}>
                失败部署
              </h3>
              <div style={{ 
                fontSize: '24px', 
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
          padding: '20px',
          borderRadius: '12px',
          position: 'relative',
          overflow: 'hidden',
          minHeight: '120px'
        }}>
          <div style={{
            position: 'absolute',
            top: '-15px',
            right: '-15px',
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            borderRadius: '50%',
            opacity: 0.1
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
            }}>
              📈
            </div>
            <div>
              <h3 style={{ 
                color: '#fff', 
                margin: '0 0 6px 0',
                fontSize: '14px',
                fontWeight: '500',
                opacity: 0.9
              }}>
                成功率
              </h3>
              <div style={{ 
                fontSize: '24px', 
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

      {/* 筛选和排序控制 */}
      <div className="glass-effect card-shadow" style={{ 
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px'
          }}>
            🔍
          </div>
          <h3 style={{ 
            margin: 0, 
            color: '#fff',
            fontSize: '18px',
            fontWeight: '600'
          }}>
            筛选和排序
          </h3>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          alignItems: 'end'
        }}>
          <div>
            <label style={{ color: '#fff', fontSize: '14px', marginBottom: '8px', display: 'block' }}>
              项目筛选
            </label>
            <input
              type="text"
              placeholder="输入项目名称"
              value={filterProject}
              onChange={(e) => {
                setFilterProject(e.target.value);
                handleFilterChange();
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                fontSize: '14px'
              }}
            />
          </div>
          
          <div>
            <label style={{ color: '#fff', fontSize: '14px', marginBottom: '8px', display: 'block' }}>
              状态筛选
            </label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                handleFilterChange();
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                fontSize: '14px'
              }}
            >
              <option value="">全部状态</option>
              <option value="success">成功</option>
              <option value="failed">失败</option>
            </select>
          </div>
          
          <div>
            <label style={{ color: '#fff', fontSize: '14px', marginBottom: '8px', display: 'block' }}>
              排序方式
            </label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order as 'ASC' | 'DESC');
              }}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                fontSize: '14px'
              }}
            >
              <option value="timestamp-DESC">时间 (最新)</option>
              <option value="timestamp-ASC">时间 (最早)</option>
              <option value="project-ASC">项目名称 (A-Z)</option>
              <option value="project-DESC">项目名称 (Z-A)</option>
              <option value="duration-ASC">耗时 (最短)</option>
              <option value="duration-DESC">耗时 (最长)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 部署记录表格 */}
      <div className="glass-effect card-shadow slide-in-left" style={{ 
        padding: '24px',
        borderRadius: '12px',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
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
              fontSize: '18px',
              fontWeight: '600'
            }}>
              部署记录
            </h3>
          </div>
          
          <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
            共 {pagination.total} 条记录
          </div>
        </div>
        
        {deployments.length > 0 ? (
          <div className="table-container">
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              color: '#fff'
            }}>
              <thead>
                <tr className="table-header">
                  <th style={{ 
                    padding: '12px', 
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '14px',
                    opacity: 0.9,
                    cursor: 'pointer'
                  }} onClick={() => handleSort('project')}>
                    项目名称 {sortBy === 'project' && (sortOrder === 'ASC' ? '↑' : '↓')}
                  </th>
                  <th style={{ 
                    padding: '12px', 
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '14px',
                    opacity: 0.9,
                    cursor: 'pointer'
                  }} onClick={() => handleSort('status')}>
                    部署状态 {sortBy === 'status' && (sortOrder === 'ASC' ? '↑' : '↓')}
                  </th>
                  <th style={{ 
                    padding: '12px', 
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '14px',
                    opacity: 0.9,
                    cursor: 'pointer'
                  }} onClick={() => handleSort('duration')}>
                    耗时 {sortBy === 'duration' && (sortOrder === 'ASC' ? '↑' : '↓')}
                  </th>
                  <th style={{ 
                    padding: '12px', 
                    textAlign: 'left',
                    fontWeight: '600',
                    fontSize: '14px',
                    opacity: 0.9,
                    cursor: 'pointer'
                  }} onClick={() => handleSort('timestamp')}>
                    部署时间 {sortBy === 'timestamp' && (sortOrder === 'ASC' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {deployments.map((deployment, index) => (
                  <tr key={deployment.id} className="table-row" style={{ 
                    animationDelay: `${index * 0.1}s`
                  }}>
                    <td style={{ 
                      padding: '12px',
                      fontWeight: '500'
                    }}>
                      {deployment.project_name}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span className={`status-${deployment.status}`} style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {getStatusIcon(deployment.status)}
                        {getStatusText(deployment.status)}
                      </span>
                    </td>
                    <td style={{ 
                      padding: '12px',
                      opacity: 0.8
                    }}>
                      {deployment.duration > 0 ? `${deployment.duration}s` : '-'}
                    </td>
                    <td style={{ 
                      padding: '12px',
                      opacity: 0.8,
                      fontSize: '13px'
                    }}>
                      {formatTime(getDeploymentTime(deployment))}
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

        {/* 分页控制 */}
        {pagination.totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(59, 130, 246, 0.2)'
          }}>
            <button
              className="btn-secondary"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              style={{ opacity: pagination.hasPrev ? 1 : 0.5 }}
            >
              上一页
            </button>
            
            <div style={{ color: '#fff', fontSize: '14px' }}>
              第 {pagination.page} 页，共 {pagination.totalPages} 页
            </div>
            
            <button
              className="btn-secondary"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
              style={{ opacity: pagination.hasNext ? 1 : 0.5 }}
            >
              下一页
            </button>
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