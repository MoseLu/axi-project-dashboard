import React from 'react';
import Dashboard from './pages/Dashboard';

const App: React.FC = () => {
  return (
    <div className="App">
      <header style={{ 
        padding: '24px 32px', 
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div>
            <h1 style={{ 
              margin: 0, 
              color: '#fff',
              fontSize: '28px',
              fontWeight: '700',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              letterSpacing: '-0.5px'
            }}>
              🚀 AXI Project Dashboard
            </h1>
            <p style={{ 
              margin: '8px 0 0 0', 
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '14px',
              fontWeight: '400'
            }}>
              智能部署进度可视化看板
            </p>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              padding: '8px 16px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '20px',
              color: '#fff',
              fontSize: '12px',
              fontWeight: '500',
              backdropFilter: 'blur(10px)'
            }}>
              📊 实时监控
            </div>
          </div>
        </div>
      </header>
      <main style={{ 
        padding: '32px',
        maxWidth: '1200px',
        margin: '0 auto',
        minHeight: 'calc(100vh - 120px)'
      }}>
        <Dashboard />
      </main>
    </div>
  );
};

export default App;