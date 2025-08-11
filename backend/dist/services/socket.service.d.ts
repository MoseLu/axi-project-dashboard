import { Server as SocketIOServer } from 'socket.io';
interface Deployment {
    id: string;
    projectId: string;
    status: string;
    [key: string]: any;
}
interface DeploymentStep {
    id: string;
    name: string;
    status: string;
    [key: string]: any;
}
export declare class SocketService {
    private io;
    private connectedUsers;
    private userSockets;
    private heartbeatInterval?;
    private metricsService;
    constructor(io: SocketIOServer);
    initialize(): Promise<void>;
    private authMiddleware;
    private handleConnection;
    private registerUserConnection;
    private setupEventListeners;
    private handleDisconnection;
    private handleProjectSubscription;
    private handleProjectUnsubscription;
    private handleDeploymentSubscription;
    private handleDeploymentUnsubscription;
    private handleHeartbeat;
    private sendConnectionEstablished;
    private sendConnectedUsers;
    private broadcastUserEvent;
    private startHeartbeat;
    emitDeploymentStarted(deployment: Deployment): void;
    emitDeploymentUpdated(deployment: Deployment): void;
    emitDeploymentCompleted(deployment: Deployment): void;
    emitDeploymentFailed(deployment: Deployment): void;
    emitStepStarted(step: DeploymentStep, deploymentId: string, projectId: string): void;
    emitStepUpdated(step: DeploymentStep, deploymentId: string, projectId: string): void;
    emitStepCompleted(step: DeploymentStep, deploymentId: string, projectId: string): void;
    emitStepFailed(step: DeploymentStep, deploymentId: string, projectId: string): void;
    emitStepRetrying(step: DeploymentStep, deploymentId: string, projectId: string): void;
    emitLogEntry(log: any, deploymentId?: string, projectId?: string): void;
    emitSystemAlert(alert: any): void;
    emitMetricsUpdate(metrics: any): void;
    emitStepUpdate(stepData: any): void;
    getConnectedUserCount(): number;
    getConnectedSocketCount(): number;
    isUserConnected(userId: string): boolean;
    getUserSocketIds(userId: string): string[];
    close(): Promise<void>;
}
export {};
//# sourceMappingURL=socket.service.d.ts.map