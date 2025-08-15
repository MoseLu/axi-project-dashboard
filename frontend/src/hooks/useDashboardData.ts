import { useState, useEffect } from 'react';
import { DeploymentDetail, Metrics, Pagination } from '../types/dashboard';
import { buildApiUrl } from '../config/env';

interface UseDashboardDataReturn {
  deployments: DeploymentDetail[];
  metrics: Metrics;
  pagination: Pagination;
  loading: boolean;
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  filterProject: string;
  filterStatus: string;
  setSortBy: (field: string) => void;
  setSortOrder: (order: 'ASC' | 'DESC') => void;
  setFilterProject: (project: string) => void;
  setFilterStatus: (status: string) => void;
  setPagination: (pagination: Pagination) => void;
  handleSort: (field: string) => void;
  handlePageChange: (page: number) => void;
  handleFilterChange: () => void;
}

export const useDashboardData = (): UseDashboardDataReturn => {
  const [deployments, setDeployments] = useState<DeploymentDetail[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({
    totalDeployments: 0,
    successfulDeployments: 0,
    failedDeployments: 0,
    averageDeploymentTime: 0,
    projectStats: [],
    dailyStats: []
  });
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [filterProject, setFilterProject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchData = async () => {
    try {
      const [deploymentsRes, metricsRes] = await Promise.all([
        fetch(`${buildApiUrl('/deployments')}?page=${pagination.page}&limit=${pagination.limit}&sortBy=${sortBy}&sortOrder=${sortOrder}${filterProject ? `&project=${filterProject}` : ''}${filterStatus ? `&status=${filterStatus}` : ''}`),
        fetch(buildApiUrl('/metrics'))
      ]);
      
      if (deploymentsRes.ok) {
        const deploymentsData = await deploymentsRes.json();
        setDeployments(Array.isArray(deploymentsData.data) ? deploymentsData.data : []);
        setPagination(deploymentsData.pagination || pagination);
      } else {
        console.error('获取部署数据失败:', deploymentsRes.status, deploymentsRes.statusText);
        setDeployments([]);
      }
      
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData.data || {
          totalDeployments: 0,
          successfulDeployments: 0,
          failedDeployments: 0,
          averageDeploymentTime: 0,
          projectStats: [],
          dailyStats: []
        });
      } else {
        console.error('获取指标数据失败:', metricsRes.status, metricsRes.statusText);
        setMetrics({
          totalDeployments: 0,
          successfulDeployments: 0,
          failedDeployments: 0,
          averageDeploymentTime: 0,
          projectStats: [],
          dailyStats: []
        });
      }
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // 每30秒刷新一次数据
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [pagination.page, pagination.limit, sortBy, sortOrder, filterProject, filterStatus]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('DESC');
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev: Pagination) => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = () => {
    setPagination((prev: Pagination) => ({ ...prev, page: 1 }));
  };

  return {
    deployments,
    metrics,
    pagination,
    loading,
    sortBy,
    sortOrder,
    filterProject,
    filterStatus,
    setSortBy,
    setSortOrder,
    setFilterProject,
    setFilterStatus,
    setPagination,
    handleSort,
    handlePageChange,
    handleFilterChange
  };
};
