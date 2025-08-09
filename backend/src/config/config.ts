import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../../.env') });

interface Config {
  // 基础配置
  nodeEnv: string;
  port: number;
  websocketPort: number;
  
  // 数据库配置
  mongodbUri: string;
  redisUri: string;
  
  // GitHub 配置
  githubToken: string;
  githubWebhookSecret: string;
  githubApiUrl: string;
  
  // JWT 配置
  jwtSecret: string;
  jwtExpiresIn: string;
  
  // CORS 配置
  corsOrigin: string | string[];
  
  // 限流配置
  rateLimitWindow: number;
  rateLimitMaxRequests: number;
  
  // 日志配置
  logLevel: string;
  logFilePath: string;
  
  // 缓存配置
  cacheTtl: number;
  cacheMaxItems: number;
  
  // 邮件配置
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  
  // Slack 配置
  slackBotToken: string;
  slackSigningSecret: string;
  slackWebhookUrl: string;
  
  // Elasticsearch 配置
  elasticsearchUrl: string;
  
  // InfluxDB 配置
  influxdbUrl: string;
  influxdbToken: string;
  influxdbOrg: string;
  influxdbBucket: string;
  
  // 文件上传配置
  uploadMaxSize: string;
  uploadAllowedTypes: string[];
  uploadPath: string;
  
  // 监控配置
  prometheusPort: number;
  metricsEnabled: boolean;
  
  // 安全配置
  sessionSecret: string;
  
  // SSL 配置
  sslEnabled: boolean;
  sslCertPath: string;
  sslKeyPath: string;
  
  // 备份配置
  backupEnabled: boolean;
  backupSchedule: string;
  backupRetentionDays: number;
  backupPath: string;
  
  // 健康检查配置
  healthCheckInterval: number;
  healthCheckTimeout: number;
  
  // WebSocket 配置
  wsHeartbeatInterval: number;
  wsMaxConnections: number;
  
  // 队列配置
  queueRedisUrl: string;
  queueMaxConcurrent: number;
  queueRetryAttempts: number;
  
  // 通知配置
  notificationEnabled: boolean;
  notificationChannels: string[];
  
  // 审计日志配置
  auditLogEnabled: boolean;
  auditLogRetention: number;
  
  // 性能监控配置
  apmEnabled: boolean;
  apmServiceName: string;
  apmEnvironment: string;
}

// 辅助函数：解析布尔值
const parseBoolean = (value: string | undefined, defaultValue: boolean = false): boolean => {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
};

// 辅助函数：解析数字
const parseNumber = (value: string | undefined, defaultValue: number): number => {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

// 辅助函数：解析数组
const parseArray = (value: string | undefined, separator: string = ','): string[] => {
  if (!value) return [];
  return value.split(separator).map(item => item.trim()).filter(Boolean);
};

// 辅助函数：解析 CORS 源
const parseCorsOrigin = (value: string | undefined): string | string[] => {
  if (!value) return '*';
  const origins = parseArray(value);
  return origins.length === 1 ? origins[0] : origins;
};

export const config: Config = {
  // 基础配置
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseNumber(process.env.PORT, 8080),
  websocketPort: parseNumber(process.env.WEBSOCKET_PORT, 8081),
  
  // 数据库配置
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/axi-deploy',
  redisUri: process.env.REDIS_URI || 'redis://localhost:6379',
  
  // GitHub 配置
  githubToken: process.env.GITHUB_TOKEN || '',
  githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET || '',
  githubApiUrl: process.env.GITHUB_API_URL || 'https://api.github.com',
  
  // JWT 配置
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // CORS 配置
  corsOrigin: parseCorsOrigin(process.env.CORS_ORIGIN),
  
  // 限流配置
  rateLimitWindow: parseNumber(process.env.RATE_LIMIT_WINDOW, 15),
  rateLimitMaxRequests: parseNumber(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
  
  // 日志配置
  logLevel: process.env.LOG_LEVEL || 'info',
  logFilePath: process.env.LOG_FILE_PATH || './logs',
  
  // 缓存配置
  cacheTtl: parseNumber(process.env.CACHE_TTL, 300),
  cacheMaxItems: parseNumber(process.env.CACHE_MAX_ITEMS, 1000),
  
  // 邮件配置
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: parseNumber(process.env.SMTP_PORT, 587),
  smtpSecure: parseBoolean(process.env.SMTP_SECURE, false),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  
  // Slack 配置
  slackBotToken: process.env.SLACK_BOT_TOKEN || '',
  slackSigningSecret: process.env.SLACK_SIGNING_SECRET || '',
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || '',
  
  // Elasticsearch 配置
  elasticsearchUrl: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  
  // InfluxDB 配置
  influxdbUrl: process.env.INFLUXDB_URL || 'http://localhost:8086',
  influxdbToken: process.env.INFLUXDB_TOKEN || '',
  influxdbOrg: process.env.INFLUXDB_ORG || 'axi-deploy',
  influxdbBucket: process.env.INFLUXDB_BUCKET || 'deployments',
  
  // 文件上传配置
  uploadMaxSize: process.env.UPLOAD_MAX_SIZE || '10MB',
  uploadAllowedTypes: parseArray(process.env.UPLOAD_ALLOWED_TYPES, ','),
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  
  // 监控配置
  prometheusPort: parseNumber(process.env.PROMETHEUS_PORT, 9090),
  metricsEnabled: parseBoolean(process.env.METRICS_ENABLED, true),
  
  // 安全配置
  sessionSecret: process.env.SESSION_SECRET || 'your-session-secret',
  
  // SSL 配置
  sslEnabled: parseBoolean(process.env.SSL_ENABLED, false),
  sslCertPath: process.env.SSL_CERT_PATH || './config/ssl/cert.pem',
  sslKeyPath: process.env.SSL_KEY_PATH || './config/ssl/key.pem',
  
  // 备份配置
  backupEnabled: parseBoolean(process.env.BACKUP_ENABLED, true),
  backupSchedule: process.env.BACKUP_SCHEDULE || '0 2 * * *',
  backupRetentionDays: parseNumber(process.env.BACKUP_RETENTION_DAYS, 30),
  backupPath: process.env.BACKUP_PATH || './backups',
  
  // 健康检查配置
  healthCheckInterval: parseNumber(process.env.HEALTH_CHECK_INTERVAL, 30),
  healthCheckTimeout: parseNumber(process.env.HEALTH_CHECK_TIMEOUT, 10),
  
  // WebSocket 配置
  wsHeartbeatInterval: parseNumber(process.env.WS_HEARTBEAT_INTERVAL, 30000),
  wsMaxConnections: parseNumber(process.env.WS_MAX_CONNECTIONS, 1000),
  
  // 队列配置
  queueRedisUrl: process.env.QUEUE_REDIS_URL || process.env.REDIS_URI || 'redis://localhost:6379',
  queueMaxConcurrent: parseNumber(process.env.QUEUE_MAX_CONCURRENT, 5),
  queueRetryAttempts: parseNumber(process.env.QUEUE_RETRY_ATTEMPTS, 3),
  
  // 通知配置
  notificationEnabled: parseBoolean(process.env.NOTIFICATION_ENABLED, true),
  notificationChannels: parseArray(process.env.NOTIFICATION_CHANNELS, ','),
  
  // 审计日志配置
  auditLogEnabled: parseBoolean(process.env.AUDIT_LOG_ENABLED, true),
  auditLogRetention: parseNumber(process.env.AUDIT_LOG_RETENTION, 365),
  
  // 性能监控配置
  apmEnabled: parseBoolean(process.env.APM_ENABLED, true),
  apmServiceName: process.env.APM_SERVICE_NAME || 'axi-deploy-dashboard',
  apmEnvironment: process.env.APM_ENVIRONMENT || process.env.NODE_ENV || 'development'
};

// 配置验证
export const validateConfig = (): void => {
  const requiredFields = [
    'jwtSecret',
    'mongodbUri',
    'redisUri'
  ];

  const missingFields = requiredFields.filter(field => !config[field as keyof Config]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required configuration fields: ${missingFields.join(', ')}`);
  }

  // 生产环境额外验证
  if (config.nodeEnv === 'production') {
    const productionRequiredFields = [
      'githubToken',
      'githubWebhookSecret'
    ];

    const missingProductionFields = productionRequiredFields.filter(
      field => !config[field as keyof Config]
    );

    if (missingProductionFields.length > 0) {
      throw new Error(
        `Missing required production configuration fields: ${missingProductionFields.join(', ')}`
      );
    }
  }
};

// 导出默认配置
export default config;
