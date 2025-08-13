import { Deployment, Metrics, ChartData } from '../types/dashboard';

export const formatTime = (timestamp: string): string => {
  return new Date(timestamp).toLocaleString('zh-CN');
};

export const getDeploymentTime = (deployment: Deployment): string => {
  return deployment.end_time || deployment.start_time || deployment.created_at;
};

export const getStatusText = (status: string): string => {
  switch (status) {
    case 'success': return '成功';
    case 'failed': return '失败';
    case 'running': return '进行中';
    case 'pending': return '等待中';
    case 'cancelled': return '已取消';
    default: return '未知';
  }
};

export const getStatusIcon = (status: string): string => {
  switch (status) {
    case 'success': return '✅';
    case 'failed': return '❌';
    case 'running': return '🔄';
    case 'pending': return '⏳';
    case 'cancelled': return '🚫';
    default: return '❓';
  }
};

export const calculateSuccessRate = (metrics: Metrics): number => {
  return metrics.totalDeployments > 0 
    ? Math.round((metrics.successfulDeployments / metrics.totalDeployments) * 100) 
    : 100;
};

export const preparePieChartData = (metrics: Metrics): ChartData[] => {
  return [
    { name: '成功', value: metrics.successfulDeployments, color: '#22c55e' },
    { name: '失败', value: metrics.failedDeployments, color: '#ef4444' },
    { name: '进行中', value: metrics.totalDeployments - metrics.successfulDeployments - metrics.failedDeployments, color: '#3b82f6' }
  ].filter(item => item.value > 0);
};

export const COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6'];
