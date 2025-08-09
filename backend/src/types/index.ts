// ===================================
// 基础类型定义
// ===================================

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
  requestId?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// ===================================
// 用户和权限相关类型
// ===================================

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  MAINTAINER = 'maintainer',
  DEVELOPER = 'developer',
  VIEWER = 'viewer'
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  description?: string;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

// ===================================
// 项目和仓库相关类型
// ===================================

export interface Project {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  repository: Repository;
  deploymentConfig: DeploymentConfig;
  environments: Environment[];
  isActive: boolean;
  tags: string[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Repository {
  owner: string;
  name: string;
  fullName: string;
  url: string;
  branch: string;
  isPrivate: boolean;
  webhookId?: string;
}

export interface Environment {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  variables: Record<string, string>;
  secrets: string[];
  isProduction: boolean;
  order: number;
}

export interface DeploymentConfig {
  deployType: 'static' | 'backend';
  buildCommand?: string;
  buildPath?: string;
  nginxConfig?: string;
  healthCheckUrl?: string;
  startCommand?: string;
  environmentVariables: Record<string, string>;
  retryConfig: RetryConfig;
}

export interface RetryConfig {
  enabled: boolean;
  maxAttempts: number;
  timeoutMinutes: number;
  retryOnFailure: boolean;
  backoffStrategy: 'linear' | 'exponential';
}

// ===================================
// 部署相关类型
// ===================================

export interface Deployment {
  id: string;
  projectId: string;
  environmentId: string;
  workflowRunId: string;
  gitCommit: GitCommit;
  status: DeploymentStatus;
  steps: DeploymentStep[];
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  triggerBy: string;
  triggerType: TriggerType;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export enum DeploymentStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  SUCCESS = 'success',
  FAILURE = 'failure',
  CANCELLED = 'cancelled',
  SKIPPED = 'skipped'
}

export enum TriggerType {
  MANUAL = 'manual',
  PUSH = 'push',
  PULL_REQUEST = 'pull_request',
  SCHEDULE = 'schedule',
  WEBHOOK = 'webhook',
  API = 'api'
}

export interface DeploymentStep {
  id: string;
  name: string;
  displayName: string;
  status: StepStatus;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  logs: StepLog[];
  retryAttempts: RetryAttempt[];
  order: number;
  isRequired: boolean;
  dependsOn: string[];
  metadata: Record<string, any>;
}

export enum StepStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  SUCCESS = 'success',
  FAILURE = 'failure',
  SKIPPED = 'skipped',
  RETRYING = 'retrying',
  CANCELLED = 'cancelled'
}

export interface StepLog {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  source: string;
  metadata?: Record<string, any>;
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

export interface RetryAttempt {
  id: string;
  attemptNumber: number;
  startedAt: Date;
  completedAt?: Date;
  status: StepStatus;
  reason: string;
  logs: StepLog[];
  duration?: number;
}

export interface GitCommit {
  sha: string;
  message: string;
  author: CommitAuthor;
  timestamp: Date;
  url: string;
}

export interface CommitAuthor {
  name: string;
  email: string;
  username?: string;
  avatar?: string;
}

// ===================================
// 监控和指标相关类型
// ===================================

export interface Metrics {
  deployments: DeploymentMetrics;
  performance: PerformanceMetrics;
  system: SystemMetrics;
  errors: ErrorMetrics;
  users: UserMetrics;
}

export interface DeploymentMetrics {
  totalDeployments: number;
  successfulDeployments: number;
  failedDeployments: number;
  successRate: number;
  averageDuration: number;
  deploymentsToday: number;
  deploymentsThisWeek: number;
  deploymentsThisMonth: number;
  trendData: TrendData[];
}

export interface PerformanceMetrics {
  averageDeploymentTime: number;
  medianDeploymentTime: number;
  p95DeploymentTime: number;
  p99DeploymentTime: number;
  buildTimeMetrics: TimeMetrics;
  deployTimeMetrics: TimeMetrics;
  testTimeMetrics: TimeMetrics;
}

export interface TimeMetrics {
  average: number;
  min: number;
  max: number;
  median: number;
  p95: number;
  p99: number;
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIO: NetworkMetrics;
  activeConnections: number;
  queueSize: number;
  uptime: number;
}

export interface NetworkMetrics {
  bytesIn: number;
  bytesOut: number;
  packetsIn: number;
  packetsOut: number;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorRate: number;
  errorsByType: Record<string, number>;
  errorsByProject: Record<string, number>;
  recentErrors: ErrorSummary[];
}

export interface ErrorSummary {
  id: string;
  message: string;
  type: string;
  projectId: string;
  timestamp: Date;
  count: number;
}

export interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  usersByRole: Record<UserRole, number>;
  loginActivity: ActivityData[];
}

export interface TrendData {
  timestamp: Date;
  value: number;
  label?: string;
}

export interface ActivityData {
  date: Date;
  count: number;
}

// ===================================
// 通知相关类型
// ===================================

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  level: NotificationLevel;
  channels: NotificationChannel[];
  recipients: string[];
  templateId?: string;
  variables: Record<string, any>;
  sentAt?: Date;
  deliveryStatus: DeliveryStatus;
  metadata: Record<string, any>;
  createdAt: Date;
}

export enum NotificationType {
  DEPLOYMENT_STARTED = 'deployment_started',
  DEPLOYMENT_SUCCESS = 'deployment_success',
  DEPLOYMENT_FAILURE = 'deployment_failure',
  DEPLOYMENT_CANCELLED = 'deployment_cancelled',
  SYSTEM_ALERT = 'system_alert',
  USER_ACTION = 'user_action',
  SECURITY_ALERT = 'security_alert'
}

export enum NotificationLevel {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum NotificationChannel {
  EMAIL = 'email',
  SLACK = 'slack',
  WEBHOOK = 'webhook',
  IN_APP = 'in_app',
  SMS = 'sms',
  WECHAT = 'wechat',
  DINGTALK = 'dingtalk'
}

export enum DeliveryStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  BOUNCED = 'bounced'
}

// ===================================
// WebSocket 相关类型
// ===================================

export interface SocketEvent {
  type: SocketEventType;
  payload: any;
  timestamp: Date;
  userId?: string;
  projectId?: string;
  deploymentId?: string;
}

export enum SocketEventType {
  // 部署事件
  DEPLOYMENT_STARTED = 'deployment:started',
  DEPLOYMENT_UPDATED = 'deployment:updated',
  DEPLOYMENT_COMPLETED = 'deployment:completed',
  DEPLOYMENT_FAILED = 'deployment:failed',
  
  // 步骤事件
  STEP_STARTED = 'step:started',
  STEP_UPDATED = 'step:updated',
  STEP_COMPLETED = 'step:completed',
  STEP_FAILED = 'step:failed',
  STEP_RETRYING = 'step:retrying',
  
  // 日志事件
  LOG_ENTRY = 'log:entry',
  LOG_BATCH = 'log:batch',
  
  // 系统事件
  SYSTEM_ALERT = 'system:alert',
  METRICS_UPDATE = 'metrics:update',
  
  // 用户事件
  USER_CONNECTED = 'user:connected',
  USER_DISCONNECTED = 'user:disconnected',
  USER_TYPING = 'user:typing',
  
  // 连接事件
  CONNECTION_ESTABLISHED = 'connection:established',
  CONNECTION_ERROR = 'connection:error',
  HEARTBEAT = 'heartbeat'
}

// ===================================
// API 相关类型
// ===================================

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
  timestamp: Date;
  path: string;
  method: string;
  userId?: string;
}

export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  uptime: number;
  version: string;
  services: ServiceHealth[];
  metrics: HealthMetrics;
}

export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime?: number;
  lastCheck: Date;
  message?: string;
}

export interface HealthMetrics {
  memoryUsage: number;
  cpuUsage: number;
  diskSpace: number;
  activeConnections: number;
  requestsPerSecond: number;
}

// ===================================
// 搜索和过滤相关类型
// ===================================

export interface SearchQuery {
  query?: string;
  filters: SearchFilter[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SearchFilter {
  field: string;
  operator: FilterOperator;
  value: any;
}

export enum FilterOperator {
  EQUALS = 'eq',
  NOT_EQUALS = 'ne',
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUAL = 'gte',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUAL = 'lte',
  CONTAINS = 'contains',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith',
  IN = 'in',
  NOT_IN = 'notIn',
  BETWEEN = 'between',
  IS_NULL = 'isNull',
  IS_NOT_NULL = 'isNotNull'
}

// ===================================
// 导出所有类型
// ===================================

export * from './express';
export * from './socket';
export * from './database';
