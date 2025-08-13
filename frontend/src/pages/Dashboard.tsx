import React, { useState } from 'react';
import { DeploymentDetail } from '../types/dashboard';
import { useDashboardData } from '../hooks/useDashboardData';
import StatsCards from '../components/dashboard/StatsCards';
import ChartsSection from '../components/dashboard/ChartsSection';
import FilterControls from '../components/dashboard/FilterControls';
import DeploymentsTable from '../components/dashboard/DeploymentsTable';
import DeploymentDetailsModal from '../components/dashboard/DeploymentDetailsModal';
import LoadingSpinner from '../components/dashboard/LoadingSpinner';

const Dashboard: React.FC = () => {
  const {
    deployments,
    metrics,
    pagination,
    loading,
    sortBy,
    sortOrder,
    filterProject,
    filterStatus,
    setFilterProject,
    setFilterStatus,
    handleSort,
    handlePageChange,
    handleFilterChange
  } = useDashboardData();

  const [selectedDeployment, setSelectedDeployment] = useState<DeploymentDetail | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleDeploymentClick = (deployment: DeploymentDetail) => {
    setSelectedDeployment(deployment);
    setShowDetails(true);
  };

  const closeDetails = () => {
    setShowDetails(false);
    setSelectedDeployment(null);
  };

  const handleSortChange = (field: string, _order: 'ASC' | 'DESC') => {
    // 直接调用handleSort，忽略传入的order参数
    handleSort(field);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="fade-in-up" style={{ padding: '24px' }}>
      {/* 统计卡片区域 */}
      <StatsCards metrics={metrics} />

      {/* 图表统计区域 */}
      <ChartsSection metrics={metrics} />

      {/* 筛选和排序控制 */}
      <FilterControls
        filterProject={filterProject}
        filterStatus={filterStatus}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onFilterProjectChange={setFilterProject}
        onFilterStatusChange={setFilterStatus}
        onSortChange={handleSortChange}
        onFilterChange={handleFilterChange}
      />

      {/* 部署记录表格 */}
      <DeploymentsTable
        deployments={deployments}
        pagination={pagination}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onDeploymentClick={handleDeploymentClick}
        onPageChange={handlePageChange}
      />

      {/* 部署详情模态框 */}
      <DeploymentDetailsModal
        deployment={selectedDeployment}
        isOpen={showDetails}
        onClose={closeDetails}
      />

      {/* 底部信息 */}
      <div style={{
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.6)',
        fontSize: '14px',
        marginTop: '40px'
      }}>
        <div style={{ marginBottom: '8px' }}>
          🔄 数据每30秒自动刷新
        </div>
        <div>
          © 2024 axi项目看板 - 智能部署监控系统
        </div>
      </div>


    </div>
  );
};

export default Dashboard;