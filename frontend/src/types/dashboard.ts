export interface Deployment {
  id: number;
  uuid: string;
  project_name: string;
  repository: string;
  branch: string;
  commit_hash: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'cancelled';
  start_time?: string;
  end_time?: string;
  duration: number;
  triggered_by?: string;
  trigger_type: 'push' | 'manual' | 'schedule';
  logs?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface JobStep {
  step_name: string;
  step_status: 'success' | 'failed' | 'running' | 'pending';
  duration?: number;
  started_at?: string;
  completed_at?: string;
  logs?: string;
  error_message?: string;
}

export interface Job {
  job_name: string;
  job_status: 'success' | 'failed' | 'running' | 'pending';
  steps: JobStep[];
  duration?: number;
  started_at?: string;
  completed_at?: string;
}

export interface DeploymentDetail extends Deployment {
  jobs?: Job[];
  workflow_name?: string;
  workflow_id?: string;
}

export interface Metrics {
  totalDeployments: number;
  successfulDeployments: number;
  failedDeployments: number;
  averageDeploymentTime: number;
  projectStats: Array<{
    project: string;
    total: number;
    success: number;
    failed: number;
    successRate: number;
  }>;
  dailyStats: Array<{
    date: string;
    total: number;
    success: number;
    failed: number;
  }>;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ChartData {
  name: string;
  value: number;
  color: string;
}
