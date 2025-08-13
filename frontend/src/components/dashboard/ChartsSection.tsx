import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Metrics } from '../../types/dashboard';
import { preparePieChartData } from '../../utils/dashboardUtils';

interface ChartsSectionProps {
  metrics: Metrics;
}

const ChartsSection: React.FC<ChartsSectionProps> = ({ metrics }) => {
  const pieChartData = preparePieChartData(metrics);

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
      gap: '24px',
      marginBottom: '32px'
    }}>
      {/* 部署状态分布饼图 */}
      <div className="chart-container">
        <h3 style={{ 
          color: '#fff', 
          margin: '0 0 20px 0',
          fontSize: '18px',
          fontWeight: '600',
          textAlign: 'center'
        }}>
          部署状态分布
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(30, 58, 138, 0.9)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 项目部署统计柱状图 */}
      <div className="chart-container">
        <h3 style={{ 
          color: '#fff', 
          margin: '0 0 20px 0',
          fontSize: '18px',
          fontWeight: '600',
          textAlign: 'center'
        }}>
          项目部署统计
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={metrics.projectStats.slice(0, 5)}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis 
              dataKey="project" 
              stroke="#fff"
              fontSize={12}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis stroke="#fff" fontSize={12} />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(30, 58, 138, 0.9)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Legend />
            <Bar dataKey="success" fill="#22c55e" name="成功" />
            <Bar dataKey="failed" fill="#ef4444" name="失败" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartsSection;
