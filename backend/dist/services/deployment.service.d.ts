import { Deployment } from '../database/models/deployment';
import { SocketService } from './socket.service';
export interface DeploymentData {
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
}
export interface DeploymentMetrics {
    totalDeployments: number;
    successfulDeployments: number;
    failedDeployments: number;
    averageDeploymentTime: number;
    projectStats?: {
        project: string;
        total: number;
        success: number;
        failed: number;
        successRate: number;
    }[];
    dailyStats?: {
        date: string;
        total: number;
        success: number;
        failed: number;
    }[];
}
export interface DeploymentQueryParams {
    page: number;
    limit: number;
    sortBy: string;
    sortOrder: 'ASC' | 'DESC';
    project?: string;
    status?: string;
}
export interface PaginatedDeployments {
    data: Deployment[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}
export declare class DeploymentService {
    private socketService;
    constructor(socketService: SocketService);
    createDeployment(data: DeploymentData): Promise<Deployment>;
    updateDeploymentStatus(id: number, status: 'success' | 'failed' | 'running', duration?: number, errorMessage?: string): Promise<Deployment | null>;
    getRecentDeployments(limit?: number): Promise<Deployment[]>;
    getDeploymentsWithPagination(params: DeploymentQueryParams): Promise<PaginatedDeployments>;
    getDeploymentMetrics(): Promise<DeploymentMetrics>;
    getProjectDeployments(project: string, limit?: number): Promise<Deployment[]>;
    cleanupOldDeployments(): Promise<number>;
    handleDeploymentWebhook(data: any): Promise<void>;
    private handleStepNotification;
    private handleDeploymentCompletion;
    private handleLogEntry;
    private handleMetricsUpdate;
}
//# sourceMappingURL=deployment.service.d.ts.map