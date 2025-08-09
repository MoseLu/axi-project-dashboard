import React from 'react';
import Dashboard from './pages/Dashboard';

const App: React.FC = () => {
  return (
    <div className="App">
      <header style={{ 
        padding: '20px', 
        background: '#f0f2f5', 
        borderBottom: '1px solid #d9d9d9' 
      }}>
        <h1 style={{ margin: 0, color: '#1890ff' }}>
          AXI Project Dashboard
        </h1>
        <p style={{ margin: '5px 0 0 0', color: '#666' }}>
          部署进度可视化看板
        </p>
      </header>
      <main style={{ padding: '20px' }}>
        <Dashboard />
      </main>
    </div>
  );
};

export default App;