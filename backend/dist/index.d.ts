import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
declare class Application {
    app: express.Application;
    server: http.Server;
    io: SocketIOServer;
    private socketService;
    private metricsService;
    private healthService;
    private deploymentService;
    private gracefulShutdown;
    constructor();
    private initializeMiddlewares;
    private initializeRoutes;
    private initializeErrorHandling;
    private initializeGracefulShutdown;
    start(): Promise<void>;
    private initializeServices;
}
declare const app: Application;
export default app;
//# sourceMappingURL=index.d.ts.map