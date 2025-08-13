import React from 'react';

interface FilterControlsProps {
  filterProject: string;
  filterStatus: string;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  onFilterProjectChange: (value: string) => void;
  onFilterStatusChange: (value: string) => void;
  onSortChange: (field: string, order: 'ASC' | 'DESC') => void;
  onFilterChange: () => void;
}

const FilterControls: React.FC<FilterControlsProps> = ({
  filterProject,
  filterStatus,
  sortBy,
  sortOrder,
  onFilterProjectChange,
  onFilterStatusChange,
  onSortChange,
  onFilterChange
}) => {
  return (
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
          <label className="form-label">项目筛选</label>
          <input
            type="text"
            placeholder="输入项目名称"
            value={filterProject}
            onChange={(e) => {
              onFilterProjectChange(e.target.value);
              onFilterChange();
            }}
            className="form-input"
          />
        </div>
        
        <div>
          <label className="form-label">状态筛选</label>
          <select
            value={filterStatus}
            onChange={(e) => {
              onFilterStatusChange(e.target.value);
              onFilterChange();
            }}
            className="form-select"
          >
            <option value="">全部状态</option>
            <option value="success">成功</option>
            <option value="failed">失败</option>
            <option value="running">进行中</option>
            <option value="pending">等待中</option>
          </select>
        </div>
        
        <div>
          <label className="form-label">排序方式</label>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              onSortChange(field, order as 'ASC' | 'DESC');
            }}
            className="form-select"
          >
            <option value="created_at-DESC">部署时间 (最新)</option>
            <option value="created_at-ASC">部署时间 (最早)</option>
            <option value="project_name-ASC">项目名称 (A-Z)</option>
            <option value="project_name-DESC">项目名称 (Z-A)</option>
            <option value="duration-ASC">耗时 (最短)</option>
            <option value="duration-DESC">耗时 (最长)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterControls;
