import React from 'react';
import { DeploymentDetail, Pagination } from '../../types/dashboard';
import { formatTime, getDeploymentTime, getStatusText, getStatusIcon } from '../../utils/dashboardUtils';

interface DeploymentsTableProps {
  deployments: DeploymentDetail[];
  pagination: Pagination;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  onSort: (field: string) => void;
  onDeploymentClick: (deployment: DeploymentDetail) => void;
  onPageChange: (page: number) => void;
}

const DeploymentsTable: React.FC<DeploymentsTableProps> = ({
  deployments,
  pagination,
  sortBy,
  sortOrder,
  onSort,
  onDeploymentClick,
  onPageChange
}) => {
  return (
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
        <div className="table-container" style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          width: '100%',
          maxWidth: '100%',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <table style={{ 
            width: '100%', 
            minWidth: '600px',
            borderCollapse: 'collapse',
            color: '#fff',
            tableLayout: 'auto'
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
                }} onClick={() => onSort('project_name')}>
                  项目名称 {sortBy === 'project_name' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '14px',
                  opacity: 0.9,
                  cursor: 'pointer'
                }} onClick={() => onSort('status')}>
                  部署状态 {sortBy === 'status' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '14px',
                  opacity: 0.9,
                  cursor: 'pointer'
                }} onClick={() => onSort('duration')}>
                  耗时 {sortBy === 'duration' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'left',
                  fontWeight: '600',
                  fontSize: '14px',
                  opacity: 0.9,
                  cursor: 'pointer'
                }} onClick={() => onSort('created_at')}>
                  部署时间 {sortBy === 'created_at' && (sortOrder === 'ASC' ? '↑' : '↓')}
                </th>
                <th style={{ 
                  padding: '12px', 
                  textAlign: 'center',
                  fontWeight: '600',
                  fontSize: '14px',
                  opacity: 0.9
                }}>
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {deployments.map((deployment, index) => (
                <tr key={deployment.id} className="table-row" style={{ 
                  animationDelay: `${index * 0.1}s`,
                  cursor: 'pointer'
                }} onClick={() => onDeploymentClick(deployment)}>
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
                  <td style={{ 
                    padding: '12px',
                    textAlign: 'center'
                  }}>
                    <button 
                      className="btn-secondary"
                      style={{ fontSize: '12px', padding: '4px 8px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeploymentClick(deployment);
                      }}
                    >
                      查看详情
                    </button>
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
            onClick={() => onPageChange(pagination.page - 1)}
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
            onClick={() => onPageChange(pagination.page + 1)}
            disabled={!pagination.hasNext}
            style={{ opacity: pagination.hasNext ? 1 : 0.5 }}
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
};

export default DeploymentsTable;
