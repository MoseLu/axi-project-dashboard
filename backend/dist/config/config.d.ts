export declare const validateConfig: () => void;
export declare const config: {
    env: string;
    nodeEnv: string;
    port: number;
    websocketPort: number;
    database: {
        mysql: {
            host: string;
            port: number;
            user: string;
            password: string;
            database: string;
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
    cors: {
        origin: string | string[];
    };
    rateLimit: {
        window: number;
        maxRequests: number;
    };
    logging: {
        level: string;
        filePath: string;
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