import React from 'react';

const LoadingSpinner: React.FC = () => {
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
};

export default LoadingSpinner;
