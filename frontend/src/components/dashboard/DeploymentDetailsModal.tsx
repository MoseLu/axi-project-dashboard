import React from 'react';
import { DeploymentDetail } from '../../types/dashboard';
import { getStatusText, getStatusIcon } from '../../utils/dashboardUtils';

interface DeploymentDetailsModalProps {
  deployment: DeploymentDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

const DeploymentDetailsModal: React.FC<DeploymentDetailsModalProps> = ({
  deployment,
  isOpen,
  onClose
}) => {
  if (!isOpen || !deployment) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-effect" style={{
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        borderRadius: '12px',
        padding: '24px',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: '24px',
            cursor: 'pointer',
            zIndex: 1
          }}
        >
          ✕
        </button>
        
        <h2 style={{ 
          color: '#fff', 
          margin: '0 0 20px 0',
          fontSize: '24px',
          fontWeight: '600'
        }}>
          {deployment.project_name} - 部署详情
        </h2>
        
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '12px' }}>基本信息</h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            <div>
              <label style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>状态</label>
              <div style={{ color: '#fff', fontWeight: '500' }}>
                {getStatusIcon(deployment.status)} {getStatusText(deployment.status)}
              </div>
            </div>
            <div>
              <label style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>耗时</label>
              <div style={{ color: '#fff', fontWeight: '500' }}>
                {deployment.duration > 0 ? `${deployment.duration}秒` : '-'}
              </div>
            </div>
            <div>
              <label style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>分支</label>
              <div style={{ color: '#fff', fontWeight: '500' }}>
                {deployment.branch}
              </div>
            </div>
            <div>
              <label style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>触发类型</label>
              <div style={{ color: '#fff', fontWeight: '500' }}>
                {deployment.trigger_type}
              </div>
            </div>
          </div>
        </div>

        {deployment.jobs && deployment.jobs.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '12px' }}>Jobs详情</h3>
            {deployment.jobs.map((job, jobIndex) => (
              <div key={jobIndex} style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '12px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  <span className={`status-${job.job_status}`} style={{
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {getStatusIcon(job.job_status)} {job.job_name}
                  </span>
                  {job.duration && (
                    <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px' }}>
                      ({job.duration}s)
                    </span>
                  )}
                </div>
                
                {job.steps && job.steps.length > 0 && (
                  <div style={{ marginLeft: '20px' }}>
                    {job.steps.map((step, stepIndex) => (
                      <div key={stepIndex} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px',
                        fontSize: '12px'
                      }}>
                        <span className={`status-${step.step_status}`} style={{
                          padding: '2px 6px',
                          borderRadius: '8px',
                          fontSize: '10px'
                        }}>
                          {getStatusIcon(step.step_status)} {step.step_name}
                        </span>
                        {step.duration && (
                          <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                            ({step.duration}s)
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {deployment.logs && (
          <div>
            <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '12px' }}>日志</h3>
            <pre style={{
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '12px',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '12px',
              overflow: 'auto',
              maxHeight: '200px'
            }}>
              {deployment.logs}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeploymentDetailsModal;
