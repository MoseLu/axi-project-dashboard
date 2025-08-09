export declare const validateConfig: () => void;
export declare const config: {
    env: string;
    nodeEnv: string;
    port: number;
    websocketPort: number;
    corsOrigin: string | string[];
    rateLimitWindow: number;
    rateLimitMaxRequests: number;
    database: {
        mongodb: {
            uri: string;
        };
        redis: {
            uri: string;
        };
    };
    jwt: {
        secret: string;
        expiresIn: string;
    };
    github: {
        token: string;
        webhookSecret: string;
        apiUrl: string;
    };
    logging: {
        level: string;
        filePath: string;
    };
    cors: {
        origin: string | string[];
    };
    rateLimit: {
        window: number;
        maxRequests: number;
    };
    cache: {
        ttl: number;
        maxItems: number;
    };
    websocket: {
        heartbeatInterval: number;
        maxConnections: number;
    };
    notifications: {
        enabled: boolean;
        channels: string[];
    };
};
export default config;
//# sourceMappingURL=config.d.ts.map