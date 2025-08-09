import React from 'react';

interface RealTimeDeploymentMonitorProps {
  projectId?: string;
}

const RealTimeDeploymentMonitor: React.FC<RealTimeDeploymentMonitorProps> = ({ 
  projectId 
}) => {
  return (
    <div style={{ 
      padding: '20px', 
      background: '#fff', 
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h3>实时部署监控</h3>
      <div style={{ 
        textAlign: 'center', 
        color: '#999', 
        padding: '40px 0' 
      }}>
        {projectId ? `监控项目: ${projectId}` : '选择项目以查看实时部署状态'}
      </div>
    </div>
  );
};

export default RealTimeDeploymentMonitor;