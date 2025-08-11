import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '@/config/config';
import { logger } from '@/utils/logger';
import { redisService } from './redis.service';
import { MetricsService } from './metrics.service';

interface SocketUser {
  userId: string;
  socketId: string;
  connectedAt: Date;
  lastActivity: Date;
  subscriptions: Set<string>;
}

// 临时类型定义
enum SocketEventType {
  CONNECTION_ESTABLISHED = 'connection_established',
  USER_CONNECTED = 'user_connected',
  USER_DISCONNECTED = 'user_disconnected',
  DEPLOYMENT_STARTED = 'deployment_started',
  DEPLOYMENT_UPDATED = 'deployment_updated',
  DEPLOYMENT_COMPLETED = 'deployment_completed',
  DEPLOYMENT_FAILED = 'deployment_failed',
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
  deploymentId?: string;
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
    } catch (error) {
      logger.error('Failed to initialize socket service:', error);
      throw error;
    }
  }

  private async authMiddleware(socket: Socket, next: Function): Promise<void> {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      
      if (!token || typeof token !== 'string') {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, config.jwt.secret) as any;
      socket.data.user = decoded;
      
      logger.debug(`Socket authentication successful for user: ${decoded.userId}`);
      next();
    } catch (error) {
      logger.warn('Socket authentication failed:', error);
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

    // 处理请求用户列表
    socket.on('request:users', () => {
      this.sendConnectedUsers(socket);
    });

    // 处理错误
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  }

  private handleDisconnection(socket: Socket): void {
    const socketUser = this.connectedUsers.get(socket.id);
    
    if (socketUser) {
      const { userId } = socketUser;
      
      // 清理连接记录
      this.connectedUsers.delete(socket.id);
      
      const userSocketSet = this.userSockets.get(userId);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          this.userSockets.delete(userId);
          // 广播用户断开连接事件
          this.broadcastUserEvent(userId, SocketEventType.USER_DISCONNECTED);
        }
      }

      // 记录指标 (异步执行，不阻塞)
      this.metricsService.recordSocketDisconnection().catch(error => {
        logger.error('Error recording socket disconnection:', error);
      });

      logger.info(`User ${userId} disconnected from socket ${socket.id}`);
    }
  }

  private handleProjectSubscription(socket: Socket, projectId: string): void {
    const socketUser = this.connectedUsers.get(socket.id);
    if (!socketUser) return;

    // 加入项目房间
    socket.join(`project:${projectId}`);
    socketUser.subscriptions.add(`project:${projectId}`);
    socketUser.lastActivity = new Date();

    logger.debug(`User ${socketUser.userId} subscribed to project ${projectId}`);
    
    // 发送订阅确认
    socket.emit('subscription:confirmed', {
      type: 'project',
      id: projectId,
      timestamp: new Date()
    });
  }

  private handleProjectUnsubscription(socket: Socket, projectId: string): void {
    const socketUser = this.connectedUsers.get(socket.id);
    if (!socketUser) return;

    // 离开项目房间
    socket.leave(`project:${projectId}`);
    socketUser.subscriptions.delete(`project:${projectId}`);
    socketUser.lastActivity = new Date();

    logger.debug(`User ${socketUser.userId} unsubscribed from project ${projectId}`);
    
    // 发送取消订阅确认
    socket.emit('unsubscription:confirmed', {
      type: 'project',
      id: projectId,
      timestamp: new Date()
    });
  }

  private handleDeploymentSubscription(socket: Socket, deploymentId: string): void {
    const socketUser = this.connectedUsers.get(socket.id);
    if (!socketUser) return;

    // 加入部署房间
    socket.join(`deployment:${deploymentId}`);
    socketUser.subscriptions.add(`deployment:${deploymentId}`);
    socketUser.lastActivity = new Date();

    logger.debug(`User ${socketUser.userId} subscribed to deployment ${deploymentId}`);
    
    // 发送订阅确认
    socket.emit('subscription:confirmed', {
      type: 'deployment',
      id: deploymentId,
      timestamp: new Date()
    });
  }

  private handleDeploymentUnsubscription(socket: Socket, deploymentId: string): void {
    const socketUser = this.connectedUsers.get(socket.id);
    if (!socketUser) return;

    // 离开部署房间
    socket.leave(`deployment:${deploymentId}`);
    socketUser.subscriptions.delete(`deployment:${deploymentId}`);
    socketUser.lastActivity = new Date();

    logger.debug(`User ${socketUser.userId} unsubscribed from deployment ${deploymentId}`);
    
    // 发送取消订阅确认
    socket.emit('unsubscription:confirmed', {
      type: 'deployment',
      id: deploymentId,
      timestamp: new Date()
    });
  }

  private handleHeartbeat(socket: Socket): void {
    const socketUser = this.connectedUsers.get(socket.id);
    if (socketUser) {
      socketUser.lastActivity = new Date();
      socket.emit('heartbeat:ack', { timestamp: new Date() });
    }
  }

  private sendConnectionEstablished(socket: Socket): void {
    const socketUser = this.connectedUsers.get(socket.id);
    if (!socketUser) return;

    const event: SocketEvent = {
      type: SocketEventType.CONNECTION_ESTABLISHED,
      payload: {
        userId: socketUser.userId,
        connectedAt: socketUser.connectedAt,
        serverTime: new Date()
      },
      timestamp: new Date(),
      userId: socketUser.userId
    };

    socket.emit('event', event);
  }

  private sendConnectedUsers(socket: Socket): void {
    const connectedUsersList = Array.from(this.userSockets.keys()).map(userId => {
      const socketIds = this.userSockets.get(userId)!;
      const firstSocket = Array.from(socketIds)[0];
      if (!firstSocket) return null;
      
      const socketUser = this.connectedUsers.get(firstSocket);
      
      return {
        userId,
        connectedAt: socketUser?.connectedAt,
        socketCount: socketIds.size
      };
    }).filter(Boolean);

    socket.emit('users:list', {
      users: connectedUsersList,
      total: connectedUsersList.length,
      timestamp: new Date()
    });
  }

  private broadcastUserEvent(userId: string, eventType: SocketEventType): void {
    const event: SocketEvent = {
      type: eventType,
      payload: { userId },
      timestamp: new Date(),
      userId
    };

    this.io.emit('event', event);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = new Date();
      const timeout = config.websocket.heartbeatInterval * 2; // 2x heartbeat interval

      // 检查并清理超时连接
      for (const [socketId, socketUser] of this.connectedUsers) {
        const timeSinceLastActivity = now.getTime() - socketUser.lastActivity.getTime();
        
        if (timeSinceLastActivity > timeout) {
          logger.warn(`Cleaning up inactive socket: ${socketId}`);
          const socket = this.io.sockets.sockets.get(socketId);
          if (socket) {
            socket.disconnect();
          }
        }
      }

      // 发送心跳到所有连接的客户端
      this.io.emit('heartbeat', { timestamp: now });
      
    }, config.websocket.heartbeatInterval);
  }

  // ===================================
  // 公共方法 - 发送事件
  // ===================================

  public emitDeploymentStarted(deployment: Deployment): void {
    const event: SocketEvent = {
      type: SocketEventType.DEPLOYMENT_STARTED,
      payload: deployment,
      timestamp: new Date(),
      projectId: deployment.projectId,
      deploymentId: deployment.id
    };

    this.io.to(`project:${deployment.projectId}`).emit('event', event);
    logger.debug(`Emitted deployment started event for ${deployment.id}`);
  }

  public emitDeploymentUpdated(deployment: Deployment): void {
    const event: SocketEvent = {
      type: SocketEventType.DEPLOYMENT_UPDATED,
      payload: deployment,
      timestamp: new Date(),
      projectId: deployment.projectId,
      deploymentId: deployment.id
    };

    this.io.to(`project:${deployment.projectId}`).emit('event', event);
    this.io.to(`deployment:${deployment.id}`).emit('event', event);
  }

  public emitDeploymentCompleted(deployment: Deployment): void {
    const event: SocketEvent = {
      type: SocketEventType.DEPLOYMENT_COMPLETED,
      payload: deployment,
      timestamp: new Date(),
      projectId: deployment.projectId,
      deploymentId: deployment.id
    };

    this.io.to(`project:${deployment.projectId}`).emit('event', event);
    this.io.to(`deployment:${deployment.id}`).emit('event', event);
  }

  public emitDeploymentFailed(deployment: Deployment): void {
    const event: SocketEvent = {
      type: SocketEventType.DEPLOYMENT_FAILED,
      payload: deployment,
      timestamp: new Date(),
      projectId: deployment.projectId,
      deploymentId: deployment.id
    };

    this.io.to(`project:${deployment.projectId}`).emit('event', event);
    this.io.to(`deployment:${deployment.id}`).emit('event', event);
  }

  public emitStepStarted(step: DeploymentStep, deploymentId: string, projectId: string): void {
    const event: SocketEvent = {
      type: SocketEventType.STEP_STARTED,
      payload: step,
      timestamp: new Date(),
      projectId,
      deploymentId
    };

    this.io.to(`deployment:${deploymentId}`).emit('event', event);
  }

  public emitStepUpdated(step: DeploymentStep, deploymentId: string, projectId: string): void {
    const event: SocketEvent = {
      type: SocketEventType.STEP_UPDATED,
      payload: step,
      timestamp: new Date(),
      projectId,
      deploymentId
    };

    this.io.to(`deployment:${deploymentId}`).emit('event', event);
  }

  public emitStepCompleted(step: DeploymentStep, deploymentId: string, projectId: string): void {
    const event: SocketEvent = {
      type: SocketEventType.STEP_COMPLETED,
      payload: step,
      timestamp: new Date(),
      projectId,
      deploymentId
    };

    this.io.to(`deployment:${deploymentId}`).emit('event', event);
  }

  public emitStepFailed(step: DeploymentStep, deploymentId: string, projectId: string): void {
    const event: SocketEvent = {
      type: SocketEventType.STEP_FAILED,
      payload: step,
      timestamp: new Date(),
      projectId,
      deploymentId
    };

    this.io.to(`deployment:${deploymentId}`).emit('event', event);
  }

  public emitStepRetrying(step: DeploymentStep, deploymentId: string, projectId: string): void {
    const event: SocketEvent = {
      type: SocketEventType.STEP_RETRYING,
      payload: step,
      timestamp: new Date(),
      projectId,
      deploymentId
    };

    this.io.to(`deployment:${deploymentId}`).emit('event', event);
  }

  public emitLogEntry(log: any, deploymentId: string, projectId: string): void {
    const event: SocketEvent = {
      type: SocketEventType.LOG_ENTRY,
      payload: log,
      timestamp: new Date(),
      projectId,
      deploymentId
    };

    this.io.to(`deployment:${deploymentId}`).emit('event', event);
  }

  public emitSystemAlert(alert: any): void {
    const event: SocketEvent = {
      type: SocketEventType.SYSTEM_ALERT,
      payload: alert,
      timestamp: new Date()
    };

    this.io.emit('event', event);
  }

  public emitMetricsUpdate(metrics: any): void {
    const event: SocketEvent = {
      type: SocketEventType.METRICS_UPDATE,
      payload: metrics,
      timestamp: new Date()
    };

    this.io.emit('event', event);
  }

  // 新增的WebSocket通知方法
  public emitStepUpdate(stepData: any): void {
    const event: SocketEvent = {
      type: SocketEventType.STEP_UPDATED,
      payload: stepData,
      timestamp: new Date(),
      projectId: stepData.projectId,
      deploymentId: stepData.deploymentId
    };

    this.io.to(`deployment:${stepData.deploymentId}`).emit('event', event);
    this.io.to(`project:${stepData.projectId}`).emit('event', event);
  }

  public emitLogEntry(logData: any): void {
    const event: SocketEvent = {
      type: SocketEventType.LOG_ENTRY,
      payload: logData,
      timestamp: new Date(),
      projectId: logData.projectId,
      deploymentId: logData.deploymentId
    };

    this.io.to(`deployment:${logData.deploymentId}`).emit('event', event);
    this.io.to(`project:${logData.projectId}`).emit('event', event);
  }

  public emitMetricsUpdate(metricsData: any): void {
    const event: SocketEvent = {
      type: SocketEventType.METRICS_UPDATE,
      payload: metricsData,
      timestamp: new Date(),
      projectId: metricsData.projectId,
      deploymentId: metricsData.deploymentId
    };

    this.io.to(`deployment:${metricsData.deploymentId}`).emit('event', event);
    this.io.to(`project:${metricsData.projectId}`).emit('event', event);
  }

  // ===================================
  // 实用方法
  // ===================================

  public getConnectedUserCount(): number {
    return this.userSockets.size;
  }

  public getConnectedSocketCount(): number {
    return this.connectedUsers.size;
  }

  public isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  public getUserSocketIds(userId: string): string[] {
    const socketSet = this.userSockets.get(userId);
    return socketSet ? Array.from(socketSet) : [];
  }

  public async close(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // 断开所有连接
    this.io.disconnectSockets(true);
    
    // 清理数据
    this.connectedUsers.clear();
    this.userSockets.clear();

    logger.info('Socket service closed');
  }
}
