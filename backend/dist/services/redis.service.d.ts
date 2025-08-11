export declare class RedisService {
    private client;
    private isConnected;
    constructor();
    private setupEventHandlers;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    set(key: string, value: string, expireInSeconds?: number): Promise<void>;
    get(key: string): Promise<string | null>;
    del(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    getClient(): any;
    isHealthy(): boolean;
}
declare const redisService: RedisService;
export declare const connectRedis: () => Promise<void>;
export declare const disconnectRedis: () => Promise<void>;
export { redisService };
//# sourceMappingURL=redis.service.d.ts.map