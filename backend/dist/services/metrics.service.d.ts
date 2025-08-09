export interface DeploymentMetrics {
    totalDeployments: number;
    successfulDeployments: number;
    failedDeployments: number;
    averageDeploymentTime: number;
    deploymentsToday: number;
    deploymentsThisWeek: number;
    deploymentsThisMonth: number;
}
export interface ProjectMetrics {
    projectId: string;
    deploymentCount: number;
    successRate: number;
    averageDeploymentTime: number;
    lastDeployment: Date | null;
}
export declare class MetricsService {
    private readonly METRICS_PREFIX;
    private readonly DEPLOYMENT_COUNT_KEY;
    private readonly SUCCESS_COUNT_KEY;
    private readonly FAILURE_COUNT_KEY;
    incrementDeploymentCount(): Promise<void>;
    incrementSuccessCount(): Promise<void>;
    incrementFailureCount(): Promise<void>;
    getDeploymentMetrics(): Promise<DeploymentMetrics>;
    recordDeploymentTime(projectId: string, duration: number): Promise<void>;
    getProjectMetrics(projectId: string): Promise<ProjectMetrics>;
    resetMetrics(): Promise<void>;
    recordRequest(method: string, path: string): Promise<void>;
    recordSocketConnection(): Promise<void>;
    recordSocketDisconnection(): Promise<void>;
    initialize(): Promise<void>;
    close(): Promise<void>;
    getMetrics(): Promise<DeploymentMetrics>;
    isHealthy(): Promise<boolean>;
}
//# sourceMappingURL=metrics.service.d.ts.map