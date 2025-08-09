export interface HealthStatus {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    uptime: number;
    services: {
        database: ServiceHealth;
        redis: ServiceHealth;
        memory: ServiceHealth;
        disk: ServiceHealth;
    };
}
export interface ServiceHealth {
    status: 'healthy' | 'unhealthy';
    message: string;
    responseTime?: number;
    details?: Record<string, any>;
}
export declare class HealthCheckService {
    getHealthStatus(): Promise<HealthStatus>;
    private checkDatabase;
    private checkRedis;
    private checkMemory;
    private checkDisk;
    private extractResult;
    private determineOverallStatus;
    initialize(): Promise<void>;
    isHealthy(): Promise<boolean>;
}
//# sourceMappingURL=health.service.d.ts.map