import { Server } from 'http';
import { Server as SocketIOServer } from 'socket.io';
export interface ShutdownOptions {
    timeout?: number;
    signals?: string[];
}
export declare class GracefulShutdown {
    private server?;
    private socketServer?;
    private isShuttingDown;
    private timeout;
    private signals;
    constructor(options?: ShutdownOptions);
    setup(server: Server, socketServer?: SocketIOServer): void;
    private shutdown;
    private closeDatabaseConnection;
    private closeRedisConnection;
}
declare const gracefulShutdown: GracefulShutdown;
export { gracefulShutdown };
//# sourceMappingURL=graceful-shutdown.d.ts.map