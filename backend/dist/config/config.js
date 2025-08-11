"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.validateConfig = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const parseBoolean = (value, defaultValue = false) => {
    if (!value)
        return defaultValue;
    return value.toLowerCase() === 'true' || value === '1';
};
const parseNumber = (value, defaultValue) => {
    if (!value)
        return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
};
const parseArray = (value, separator = ',') => {
    if (!value)
        return [];
    return value.split(separator).map(item => item.trim()).filter(Boolean);
};
const parseCorsOrigin = (value) => {
    if (!value)
        return '*';
    const origins = parseArray(value);
    return origins.length === 1 ? origins[0] : origins;
};
const configData = {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseNumber(process.env.PORT, 8081),
    websocketPort: parseNumber(process.env.WEBSOCKET_PORT, 8082),
    mysqlHost: process.env.MYSQL_HOST || '127.0.0.1',
    mysqlPort: parseNumber(process.env.MYSQL_PORT, 3306),
    mysqlUser: process.env.MYSQL_USER || 'root',
    mysqlPassword: process.env.MYSQL_PASSWORD || '123456',
    mysqlDatabase: process.env.MYSQL_DATABASE || 'project_dashboard',
    redisUri: process.env.REDIS_URI || 'redis://localhost:6379',
    githubToken: process.env.GITHUB_TOKEN || '',
    githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET || '',
    githubApiUrl: process.env.GITHUB_API_URL || 'https://api.github.com',
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    corsOrigin: parseCorsOrigin(process.env.CORS_ORIGIN),
    rateLimitWindow: parseNumber(process.env.RATE_LIMIT_WINDOW, 15),
    rateLimitMaxRequests: parseNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
    logLevel: process.env.LOG_LEVEL || 'info',
    logFilePath: process.env.LOG_FILE_PATH || './logs',
    cacheTtl: parseNumber(process.env.CACHE_TTL, 300),
    cacheMaxItems: parseNumber(process.env.CACHE_MAX_ITEMS, 1000),
    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
    smtpPort: parseNumber(process.env.SMTP_PORT, 587),
    smtpSecure: parseBoolean(process.env.SMTP_SECURE, false),
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    slackBotToken: process.env.SLACK_BOT_TOKEN || '',
    slackSigningSecret: process.env.SLACK_SIGNING_SECRET || '',
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || '',
    elasticsearchUrl: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    influxdbUrl: process.env.INFLUXDB_URL || 'http://localhost:8086',
    influxdbToken: process.env.INFLUXDB_TOKEN || '',
    influxdbOrg: process.env.INFLUXDB_ORG || 'axi-deploy',
    influxdbBucket: process.env.INFLUXDB_BUCKET || 'deployments',
    uploadMaxSize: process.env.UPLOAD_MAX_SIZE || '10MB',
    uploadAllowedTypes: parseArray(process.env.UPLOAD_ALLOWED_TYPES, ','),
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    prometheusPort: parseNumber(process.env.PROMETHEUS_PORT, 9090),
    metricsEnabled: parseBoolean(process.env.METRICS_ENABLED, true),
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret',
    sslEnabled: parseBoolean(process.env.SSL_ENABLED, false),
    sslCertPath: process.env.SSL_CERT_PATH || './config/ssl/cert.pem',
    sslKeyPath: process.env.SSL_KEY_PATH || './config/ssl/key.pem',
    backupEnabled: parseBoolean(process.env.BACKUP_ENABLED, true),
    backupSchedule: process.env.BACKUP_SCHEDULE || '0 2 * * *',
    backupRetentionDays: parseNumber(process.env.BACKUP_RETENTION_DAYS, 30),
    backupPath: process.env.BACKUP_PATH || './backups',
    healthCheckInterval: parseNumber(process.env.HEALTH_CHECK_INTERVAL, 30),
    healthCheckTimeout: parseNumber(process.env.HEALTH_CHECK_TIMEOUT, 10),
    wsHeartbeatInterval: parseNumber(process.env.WS_HEARTBEAT_INTERVAL, 30000),
    wsMaxConnections: parseNumber(process.env.WS_MAX_CONNECTIONS, 1000),
    queueRedisUrl: process.env.QUEUE_REDIS_URL || process.env.REDIS_URI || 'redis://localhost:6379',
    queueMaxConcurrent: parseNumber(process.env.QUEUE_MAX_CONCURRENT, 5),
    queueRetryAttempts: parseNumber(process.env.QUEUE_RETRY_ATTEMPTS, 3),
    notificationEnabled: parseBoolean(process.env.NOTIFICATION_ENABLED, true),
    notificationChannels: parseArray(process.env.NOTIFICATION_CHANNELS, ','),
    auditLogEnabled: parseBoolean(process.env.AUDIT_LOG_ENABLED, true),
    auditLogRetention: parseNumber(process.env.AUDIT_LOG_RETENTION, 365),
    apmEnabled: parseBoolean(process.env.APM_ENABLED, true),
    apmServiceName: process.env.APM_SERVICE_NAME || 'axi-deploy-dashboard',
    apmEnvironment: process.env.APM_ENVIRONMENT || process.env.NODE_ENV || 'development'
};
const validateConfig = () => {
    const requiredFields = [
        'jwt.secret',
        'database.mysql.host',
        'database.redis.uri'
    ];
    const missingFields = requiredFields.filter(field => {
        const keys = field.split('.');
        let current = exports.config;
        for (const key of keys) {
            if (!current || !current[key]) {
                return true;
            }
            current = current[key];
        }
        return false;
    });
    if (missingFields.length > 0) {
        throw new Error(`Missing required configuration fields: ${missingFields.join(', ')}`);
    }
    if (exports.config.env === 'production') {
        const productionRequiredFields = [
            'github.token',
            'github.webhookSecret'
        ];
        const missingProductionFields = productionRequiredFields.filter(field => {
            const keys = field.split('.');
            let current = exports.config;
            for (const key of keys) {
                if (!current || !current[key]) {
                    return true;
                }
                current = current[key];
            }
            return false;
        });
        if (missingProductionFields.length > 0) {
            throw new Error(`Missing required production configuration fields: ${missingProductionFields.join(', ')}`);
        }
    }
};
exports.validateConfig = validateConfig;
exports.config = {
    env: configData.nodeEnv,
    nodeEnv: configData.nodeEnv,
    port: configData.port,
    websocketPort: configData.websocketPort,
    database: {
        mysql: {
            host: configData.mysqlHost,
            port: configData.mysqlPort,
            user: configData.mysqlUser,
            password: configData.mysqlPassword,
            database: configData.mysqlDatabase
        },
        redis: {
            uri: configData.redisUri
        }
    },
    jwt: {
        secret: configData.jwtSecret,
        expiresIn: configData.jwtExpiresIn
    },
    github: {
        token: configData.githubToken,
        webhookSecret: configData.githubWebhookSecret,
        apiUrl: configData.githubApiUrl
    },
    cors: {
        origin: configData.corsOrigin
    },
    rateLimit: {
        window: configData.rateLimitWindow,
        maxRequests: configData.rateLimitMaxRequests
    },
    logging: {
        level: configData.logLevel,
        filePath: configData.logFilePath
    },
    cache: {
        ttl: configData.cacheTtl,
        maxItems: configData.cacheMaxItems
    },
    websocket: {
        heartbeatInterval: configData.wsHeartbeatInterval,
        maxConnections: configData.wsMaxConnections
    },
    notifications: {
        enabled: configData.notificationEnabled,
        channels: configData.notificationChannels
    }
};
exports.default = exports.config;
//# sourceMappingURL=config.js.map