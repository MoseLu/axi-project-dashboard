import React from 'react';
import { Metrics } from '../../types/dashboard';
import { calculateSuccessRate } from '../../utils/dashboardUtils';

interface StatsCardsProps {
  metrics: Metrics;
}

const StatsCards: React.FC<StatsCardsProps> = ({ metrics }) => {
  const successRate = calculateSuccessRate(metrics);

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
      gap: '16px',
      marginBottom: '32px'
    }}>
      {/* 总部署次数卡片 */}
      <div className="stats-card" style={{ 
        padding: '20px',
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
          background: 'var(--gradient-primary)',
          borderRadius: '50%',
          opacity: 0.1
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'var(--gradient-primary)',
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
            <h3 className="stats-title" style={{ 
              margin: '0 0 6px 0',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              总部署次数
            </h3>
            <div className="stats-value" style={{ 
              fontSize: '24px', 
              fontWeight: '700'
            }}>
              {metrics.totalDeployments}
            </div>
          </div>
        </div>
      </div>
      
      {/* 成功部署卡片 */}
      <div className="stats-card" style={{ 
        padding: '20px',
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
          background: 'var(--gradient-success)',
          borderRadius: '50%',
          opacity: 0.1
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'var(--gradient-success)',
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
            <h3 className="stats-title" style={{ 
              margin: '0 0 6px 0',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              成功部署
            </h3>
            <div className="stats-value" style={{ 
              fontSize: '24px', 
              fontWeight: '700'
            }}>
              {metrics.successfulDeployments}
            </div>
          </div>
        </div>
      </div>
      
      {/* 失败部署卡片 */}
      <div className="stats-card" style={{ 
        padding: '20px',
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
          background: 'var(--gradient-error)',
          borderRadius: '50%',
          opacity: 0.1
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'var(--gradient-error)',
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
            <h3 className="stats-title" style={{ 
              margin: '0 0 6px 0',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              失败部署
            </h3>
            <div className="stats-value" style={{ 
              fontSize: '24px', 
              fontWeight: '700'
            }}>
              {metrics.failedDeployments}
            </div>
          </div>
        </div>
      </div>
      
      {/* 成功率卡片 */}
      <div className="stats-card" style={{ 
        padding: '20px',
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
          background: 'var(--gradient-warning)',
          borderRadius: '50%',
          opacity: 0.1
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'var(--gradient-warning)',
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
            <h3 className="stats-title" style={{ 
              margin: '0 0 6px 0',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              成功率
            </h3>
            <div className="stats-value" style={{ 
              fontSize: '24px', 
              fontWeight: '700'
            }}>
              {successRate}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;
