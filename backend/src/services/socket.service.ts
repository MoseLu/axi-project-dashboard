import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '@/config/config';
import { logger } from '@/utils/logger';
import { redisService } from './redis.service';
import { MetricsService } from './metrics.service';
import { setSocketConnections } from '@/observability/prometheus';
import { metrics } from '@/middleware/prometheus.middleware';

interface SocketUser {
  userId: string;
  socketId: string;
  connectedAt: Date;
  lastActivity: Date;
  subscriptions: Set<string>;
}

enum SocketEventType {
  CONNECTION_ESTABLISHED = 'connection_established',
  USER_CONNECTED = 'user_connected',
  USER_DISCONNECTED = 'user_disconnected',
  DEPLOYMENT_STARTED = 'deployment_started',
  DEPLOYMENT_UPDATED = 'deployment_updated',
  DEPLOYMENT_COMPLETED = 'deployment_completed',
  DEPLOYMENT_FAILED = 'deployment_failed',
  STEP_CREATED = 'step_created',
  STEP_STARTED = 'step_started',
  STEP_UPDATED = 'step_updated',
  STEP_COMPLETED = 'step_completed',
  STEP_FAILED = 'step_failed',
  STEP_RETRYING = 'step_retrying',
  LOG_ENTRY = 'log_entry',
  SYSTEM_ALERT = 'system_alert',
  METRICS_UPDATE = 'metrics_update'
}

interface SocketEvent {
  type: SocketEventType;
  payload: any;
  timestamp: Date;
  userId?: string;
  projectId?: string;
  deploymentId?: string | undefined;
}

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

export class SocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, SocketUser> = new Map();
  private userSockets: Map<string, Set<string>> = new Map();
  private heartbeatInterval?: NodeJS.Timeout;
  private metricsService: MetricsService;

  constructor(io: SocketIOServer) {
    this.io = io;
    this.metricsService = new MetricsService();
  }

  public async initialize(): Promise<void> {
    try {
      // 设置认证中间件
      this.io.use(this.authMiddleware.bind(this));

      // 设置连接处理
      this.io.on('connection', this.handleConnection.bind(this));

      // 启动心跳检测
      this.startHeartbeat();

      logger.info('Socket service initialized successfully');
      logger.info(`Socket.io path: ${this.io.path()}`);
      logger.info(`Socket.io transports: ${this.io.engine.opts.transports}`);
    } catch (error) {
      logger.error('Failed to initialize socket service:', error);
      throw error;
    }
  }

  private async authMiddleware(socket: Socket, next: Function): Promise<void> {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      
      logger.debug(`Socket authentication attempt for socket ${socket.id}:`, {
        hasAuthToken: !!socket.handshake.auth?.token,
        hasQueryToken: !!socket.handshake.query?.token,
        token: token ? `${token.substring(0, 10)}...` : 'none'
      });

      // 更新连接指标
      metrics.activeConnections.set(this.connectedUsers.size);
      
      if (!token || typeof token !== 'string') {
        logger.warn(`Socket ${socket.id} rejected: No authentication token`);
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, config.jwt.secret) as any;
      socket.data.user = decoded;
      
      logger.debug(`Socket authentication successful for user: ${decoded.userId}`);
      next();
    } catch (error) {
      logger.warn(`Socket ${socket.id} authentication failed:`, error);
      next(new Error('Authentication failed'));
    }
  }

  private handleConnection(socket: Socket): void {
    const user = socket.data.user;
    const userId = user?.userId;
    
    if (!userId) {
      logger.warn('Socket connected without valid user data');
      socket.disconnect();
      return;
    }

    // 注册用户连接
    this.registerUserConnection(userId, socket);

    // 设置事件监听器
    this.setupEventListeners(socket);

    // 发送连接确认
    this.sendConnectionEstablished(socket);

    // 记录指标 (异步执行，不阻塞)
    this.metricsService.recordSocketConnection().catch(error => {
      logger.error('Error recording socket connection:', error);
    });

    // 更新 Prometheus 指标
    metrics.activeConnections.set(this.getConnectedSocketCount());

    try { 
      setSocketConnections(this.getConnectedSocketCount()); 
    } catch (_) {}
    
    logger.info(`User ${userId} connected via socket ${socket.id}`);
  }

  private registerUserConnection(userId: string, socket: Socket): void {
    const socketUser: SocketUser = {
      userId,
      socketId: socket.id,
      connectedAt: new Date(),
      lastActivity: new Date(),
      subscriptions: new Set()
    };

    this.connectedUsers.set(socket.id, socketUser);

    // 维护用户到Socket的映射
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socket.id);

    // 广播用户连接事件
    this.broadcastUserEvent(userId, SocketEventType.USER_CONNECTED);
  }

  private setupEventListeners(socket: Socket): void {
    // 处理断开连接
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });

    // 处理订阅项目事件
    socket.on('subscribe:project', (projectId: string) => {
      this.handleProjectSubscription(socket, projectId);
    });

    // 处理取消订阅项目事件
    socket.on('unsubscribe:project', (projectId: string) => {
      this.handleProjectUnsubscription(socket, projectId);
    });

    // 处理订阅部署事件
    socket.on('subscribe:deployment', (deploymentId: string) => {
      this.handleDeploymentSubscription(socket, deploymentId);
    });

    // 处理取消订阅部署事件
    socket.on('unsubscribe:deployment', (deploymentId: string) => {
      this.handleDeploymentUnsubscription(socket, deploymentId);
    });

    // 处理心跳
    socket.on('heartbeat', () => {
      this.handleHeartbeat(socket);
    });

    // 处理错误
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  }

  private handleDisconnection(socket: Socket): void {
    const user = this.connectedUsers.get(socket.id);
    if (!user) {
      logger.warn(`Socket ${socket.id} disconnected but not found in connected users`);
      return;
    }

    const userId = user.userId;

    // 清理用户连接
    this.connectedUsers.delete(socket.id);

    // 清理用户到Socket的映射
    const userSocketSet = this.userSockets.get(userId);
    if (userSocketSet) {
      userSocketSet.delete(socket.id);
      if (userSocketSet.size === 0) {
        this.userSockets.delete(userId);
      }
    }

    // 广播用户断开连接事件
    this.broadcastUserEvent(userId, SocketEventType.USER_DISCONNECTED);

    // 更新指标
    metrics.activeConnections.set(this.getConnectedSocketCount());
    try { 
      setSocketConnections(this.getConnectedSocketCount()); 
    } catch (_) {}

    logger.info(`User ${userId} disconnected from socket ${socket.id}`);
  }

  private handleProjectSubscription(socket: Socket, projectId: string): void {
    const user = this.connectedUsers.get(socket.id);
    if (!user) {
      logger.warn(`Socket ${socket.id} tried to subscribe to project ${projectId} but not found in connected users`);
      return;
    }

    user.subscriptions.add(`project:${projectId}`);
    user.lastActivity = new Date();

    logger.debug(`User ${user.userId} subscribed to project ${projectId}`);
    socket.emit('subscription:confirmed', { type: 'project', projectId });
  }

  private handleProjectUnsubscription(socket: Socket, projectId: string): void {
    const user = this.connectedUsers.get(socket.id);
    if (!user) {
      return;
    }

    user.subscriptions.delete(`project:${projectId}`);
    user.lastActivity = new Date();

    logger.debug(`User ${user.userId} unsubscribed from project ${projectId}`);
    socket.emit('unsubscription:confirmed', { type: 'project', projectId });
  }

  private handleDeploymentSubscription(socket: Socket, deploymentId: string): void {
    const user = this.connectedUsers.get(socket.id);
    if (!user) {
      logger.warn(`Socket ${socket.id} tried to subscribe to deployment ${deploymentId} but not found in connected users`);
      return;
    }

    user.subscriptions.add(`deployment:${deploymentId}`);
    user.lastActivity = new Date();

    logger.debug(`User ${user.userId} subscribed to deployment ${deploymentId}`);
    socket.emit('subscription:confirmed', { type: 'deployment', deploymentId });
  }

  private handleDeploymentUnsubscription(socket: Socket, deploymentId: string): void {
    const user = this.connectedUsers.get(socket.id);
    if (!user) {
      return;
    }

    user.subscriptions.delete(`deployment:${deploymentId}`);
    user.lastActivity = new Date();

    logger.debug(`User ${user.userId} unsubscribed from deployment ${deploymentId}`);
    socket.emit('unsubscription:confirmed', { type: 'deployment', deploymentId });
  }

  private handleHeartbeat(socket: Socket): void {
    const user = this.connectedUsers.get(socket.id);
    if (user) {
      user.lastActivity = new Date();
      socket.emit('heartbeat:ack');
    }
  }

  private sendConnectionEstablished(socket: Socket): void {
    const event: SocketEvent = {
      type: SocketEventType.CONNECTION_ESTABLISHED,
      payload: {
        socketId: socket.id,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date()
    };

    socket.emit('connection:established', event);
  }

  private broadcastUserEvent(userId: string, eventType: SocketEventType): void {
    const event: SocketEvent = {
      type: eventType,
      payload: { userId },
      timestamp: new Date(),
      userId
    };

    // 广播给所有连接的客户端
    this.io.emit('user:event', event);
  }

  public broadcastDeploymentEvent(deployment: Deployment, eventType: SocketEventType): void {
    const event: SocketEvent = {
      type: eventType,
      payload: deployment,
      timestamp: new Date(),
      projectId: deployment.projectId,
      deploymentId: deployment.id
    };

    // 广播给所有订阅了该项目的用户
    this.broadcastToProjectSubscribers(deployment.projectId, 'deployment:event', event);
  }

  public broadcastDeploymentStepEvent(step: DeploymentStep, deploymentId: string, projectId: string, eventType: SocketEventType): void {
    const event: SocketEvent = {
      type: eventType,
      payload: step,
      timestamp: new Date(),
      projectId,
      deploymentId
    };

    // 广播给所有订阅了该部署的用户
    this.broadcastToDeploymentSubscribers(deploymentId, 'deployment:step:event', event);
  }

  public broadcastLogEntry(logEntry: any, projectId: string, deploymentId?: string): void {
    const event: SocketEvent = {
      type: SocketEventType.LOG_ENTRY,
      payload: logEntry,
      timestamp: new Date(),
      projectId,
      deploymentId
    };

    if (deploymentId) {
      this.broadcastToDeploymentSubscribers(deploymentId, 'log:entry', event);
    } else {
      this.broadcastToProjectSubscribers(projectId, 'log:entry', event);
    }
  }

  public broadcastSystemAlert(alert: any): void {
    const event: SocketEvent = {
      type: SocketEventType.SYSTEM_ALERT,
      payload: alert,
      timestamp: new Date()
    };

    // 广播给所有连接的客户端
    this.io.emit('system:alert', event);
  }

  public broadcastMetricsUpdate(metrics: any): void {
    const event: SocketEvent = {
      type: SocketEventType.METRICS_UPDATE,
      payload: metrics,
      timestamp: new Date()
    };

    // 广播给所有连接的客户端
    this.io.emit('metrics:update', event);
  }

  private broadcastToProjectSubscribers(projectId: string, eventName: string, event: SocketEvent): void {
    for (const [socketId, user] of this.connectedUsers) {
      if (user.subscriptions.has(`project:${projectId}`)) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit(eventName, event);
        }
      }
    }
  }

  private broadcastToDeploymentSubscribers(deploymentId: string, eventName: string, event: SocketEvent): void {
    for (const [socketId, user] of this.connectedUsers) {
      if (user.subscriptions.has(`deployment:${deploymentId}`)) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit(eventName, event);
        }
      }
    }
  }

  private startHeartbeat(): void {
    // 每30秒检查一次心跳
    this.heartbeatInterval = setInterval(() => {
      const now = new Date();
      const timeout = 60 * 1000; // 60秒超时

      for (const [socketId, user] of this.connectedUsers) {
        if (now.getTime() - user.lastActivity.getTime() > timeout) {
          logger.warn(`Socket ${socketId} timed out, disconnecting`);
          const socket = this.io.sockets.sockets.get(socketId);
          if (socket) {
            socket.disconnect();
          }
        }
      }
    }, 30000);
  }

  public getConnectedSocketCount(): number {
    return this.connectedUsers.size;
  }

  public getConnectedUserCount(): number {
    return this.userSockets.size;
  }

  public getConnectedUsers(): Map<string, SocketUser> {
    return new Map(this.connectedUsers);
  }

  public disconnectUser(userId: string): void {
    const userSocketSet = this.userSockets.get(userId);
    if (userSocketSet) {
      for (const socketId of userSocketSet) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect();
        }
      }
      this.userSockets.delete(userId);
    }
  }

  public async shutdown(): Promise<void> {
    try {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
      }

      // 断开所有连接
      this.io.disconnectSockets();

      logger.info('Socket service shutdown completed');
    } catch (error) {
      logger.error('Error during socket service shutdown:', error);
      throw error;
    }
  }
}
