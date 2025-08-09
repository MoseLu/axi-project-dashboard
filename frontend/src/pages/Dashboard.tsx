import React from 'react';

const Dashboard: React.FC = () => {
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
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>0</div>
        </div>
        
        <div style={{ 
          padding: '20px', 
          background: '#fff', 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: '#1890ff', margin: '0 0 10px 0' }}>成功部署</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>0</div>
        </div>
        
        <div style={{ 
          padding: '20px', 
          background: '#fff', 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: '#ff4d4f', margin: '0 0 10px 0' }}>失败部署</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>0</div>
        </div>
        
        <div style={{ 
          padding: '20px', 
          background: '#fff', 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ color: '#fa8c16', margin: '0 0 10px 0' }}>成功率</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>100%</div>
        </div>
      </div>

      <div style={{ 
        padding: '20px', 
        background: '#fff', 
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3>最近部署</h3>
        <div style={{ 
          textAlign: 'center', 
          color: '#999', 
          padding: '40px 0' 
        }}>
          暂无部署记录
        </div>
      </div>
    </div>
  );
};

export default Dashboard;