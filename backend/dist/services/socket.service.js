"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
const metrics_service_1 = require("./metrics.service");
var SocketEventType;
(function (SocketEventType) {
    SocketEventType["CONNECTION_ESTABLISHED"] = "connection_established";
    SocketEventType["USER_CONNECTED"] = "user_connected";
    SocketEventType["USER_DISCONNECTED"] = "user_disconnected";
    SocketEventType["DEPLOYMENT_STARTED"] = "deployment_started";
    SocketEventType["DEPLOYMENT_UPDATED"] = "deployment_updated";
    SocketEventType["DEPLOYMENT_COMPLETED"] = "deployment_completed";
    SocketEventType["DEPLOYMENT_FAILED"] = "deployment_failed";
    SocketEventType["STEP_STARTED"] = "step_started";
    SocketEventType["STEP_UPDATED"] = "step_updated";
    SocketEventType["STEP_COMPLETED"] = "step_completed";
    SocketEventType["STEP_FAILED"] = "step_failed";
    SocketEventType["STEP_RETRYING"] = "step_retrying";
    SocketEventType["LOG_ENTRY"] = "log_entry";
    SocketEventType["SYSTEM_ALERT"] = "system_alert";
    SocketEventType["METRICS_UPDATE"] = "metrics_update";
})(SocketEventType || (SocketEventType = {}));
class SocketService {
    constructor(io) {
        this.connectedUsers = new Map();
        this.userSockets = new Map();
        this.io = io;
        this.metricsService = new metrics_service_1.MetricsService();
    }
    async initialize() {
        try {
            this.io.use(this.authMiddleware.bind(this));
            this.io.on('connection', this.handleConnection.bind(this));
            this.startHeartbeat();
            logger_1.logger.info('Socket service initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize socket service:', error);
            throw error;
        }
    }
    async authMiddleware(socket, next) {
        try {
            const token = socket.handshake.auth?.token || socket.handshake.query?.token;
            if (!token || typeof token !== 'string') {
                return next(new Error('Authentication token required'));
            }
            const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
            socket.data.user = decoded;
            logger_1.logger.debug(`Socket authentication successful for user: ${decoded.userId}`);
            next();
        }
        catch (error) {
            logger_1.logger.warn('Socket authentication failed:', error);
            next(new Error('Authentication failed'));
        }
    }
    handleConnection(socket) {
        const user = socket.data.user;
        const userId = user?.userId;
        if (!userId) {
            logger_1.logger.warn('Socket connected without valid user data');
            socket.disconnect();
            return;
        }
        this.registerUserConnection(userId, socket);
        this.setupEventListeners(socket);
        this.sendConnectionEstablished(socket);
        this.metricsService.recordSocketConnection().catch(error => {
            logger_1.logger.error('Error recording socket connection:', error);
        });
        logger_1.logger.info(`User ${userId} connected via socket ${socket.id}`);
    }
    registerUserConnection(userId, socket) {
        const socketUser = {
            userId,
            socketId: socket.id,
            connectedAt: new Date(),
            lastActivity: new Date(),
            subscriptions: new Set()
        };
        this.connectedUsers.set(socket.id, socketUser);
        if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, new Set());
        }
        this.userSockets.get(userId).add(socket.id);
        this.broadcastUserEvent(userId, SocketEventType.USER_CONNECTED);
    }
    setupEventListeners(socket) {
        socket.on('disconnect', () => {
            this.handleDisconnection(socket);
        });
        socket.on('subscribe:project', (projectId) => {
            this.handleProjectSubscription(socket, projectId);
        });
        socket.on('unsubscribe:project', (projectId) => {
            this.handleProjectUnsubscription(socket, projectId);
        });
        socket.on('subscribe:deployment', (deploymentId) => {
            this.handleDeploymentSubscription(socket, deploymentId);
        });
        socket.on('unsubscribe:deployment', (deploymentId) => {
            this.handleDeploymentUnsubscription(socket, deploymentId);
        });
        socket.on('heartbeat', () => {
            this.handleHeartbeat(socket);
        });
        socket.on('request:users', () => {
            this.sendConnectedUsers(socket);
        });
        socket.on('error', (error) => {
            logger_1.logger.error(`Socket error for ${socket.id}:`, error);
        });
    }
    handleDisconnection(socket) {
        const socketUser = this.connectedUsers.get(socket.id);
        if (socketUser) {
            const { userId } = socketUser;
            this.connectedUsers.delete(socket.id);
            const userSocketSet = this.userSockets.get(userId);
            if (userSocketSet) {
                userSocketSet.delete(socket.id);
                if (userSocketSet.size === 0) {
                    this.userSockets.delete(userId);
                    this.broadcastUserEvent(userId, SocketEventType.USER_DISCONNECTED);
                }
            }
            this.metricsService.recordSocketDisconnection().catch(error => {
                logger_1.logger.error('Error recording socket disconnection:', error);
            });
            logger_1.logger.info(`User ${userId} disconnected from socket ${socket.id}`);
        }
    }
    handleProjectSubscription(socket, projectId) {
        const socketUser = this.connectedUsers.get(socket.id);
        if (!socketUser)
            return;
        socket.join(`project:${projectId}`);
        socketUser.subscriptions.add(`project:${projectId}`);
        socketUser.lastActivity = new Date();
        logger_1.logger.debug(`User ${socketUser.userId} subscribed to project ${projectId}`);
        socket.emit('subscription:confirmed', {
            type: 'project',
            id: projectId,
            timestamp: new Date()
        });
    }
    handleProjectUnsubscription(socket, projectId) {
        const socketUser = this.connectedUsers.get(socket.id);
        if (!socketUser)
            return;
        socket.leave(`project:${projectId}`);
        socketUser.subscriptions.delete(`project:${projectId}`);
        socketUser.lastActivity = new Date();
        logger_1.logger.debug(`User ${socketUser.userId} unsubscribed from project ${projectId}`);
        socket.emit('unsubscription:confirmed', {
            type: 'project',
            id: projectId,
            timestamp: new Date()
        });
    }
    handleDeploymentSubscription(socket, deploymentId) {
        const socketUser = this.connectedUsers.get(socket.id);
        if (!socketUser)
            return;
        socket.join(`deployment:${deploymentId}`);
        socketUser.subscriptions.add(`deployment:${deploymentId}`);
        socketUser.lastActivity = new Date();
        logger_1.logger.debug(`User ${socketUser.userId} subscribed to deployment ${deploymentId}`);
        socket.emit('subscription:confirmed', {
            type: 'deployment',
            id: deploymentId,
            timestamp: new Date()
        });
    }
    handleDeploymentUnsubscription(socket, deploymentId) {
        const socketUser = this.connectedUsers.get(socket.id);
        if (!socketUser)
            return;
        socket.leave(`deployment:${deploymentId}`);
        socketUser.subscriptions.delete(`deployment:${deploymentId}`);
        socketUser.lastActivity = new Date();
        logger_1.logger.debug(`User ${socketUser.userId} unsubscribed from deployment ${deploymentId}`);
        socket.emit('unsubscription:confirmed', {
            type: 'deployment',
            id: deploymentId,
            timestamp: new Date()
        });
    }
    handleHeartbeat(socket) {
        const socketUser = this.connectedUsers.get(socket.id);
        if (socketUser) {
            socketUser.lastActivity = new Date();
            socket.emit('heartbeat:ack', { timestamp: new Date() });
        }
    }
    sendConnectionEstablished(socket) {
        const socketUser = this.connectedUsers.get(socket.id);
        if (!socketUser)
            return;
        const event = {
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
    sendConnectedUsers(socket) {
        const connectedUsersList = Array.from(this.userSockets.keys()).map(userId => {
            const socketIds = this.userSockets.get(userId);
            const firstSocket = Array.from(socketIds)[0];
            if (!firstSocket)
                return null;
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
    broadcastUserEvent(userId, eventType) {
        const event = {
            type: eventType,
            payload: { userId },
            timestamp: new Date(),
            userId
        };
        this.io.emit('event', event);
    }
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            const now = new Date();
            const timeout = config_1.config.websocket.heartbeatInterval * 2;
            for (const [socketId, socketUser] of this.connectedUsers) {
                const timeSinceLastActivity = now.getTime() - socketUser.lastActivity.getTime();
                if (timeSinceLastActivity > timeout) {
                    logger_1.logger.warn(`Cleaning up inactive socket: ${socketId}`);
                    const socket = this.io.sockets.sockets.get(socketId);
                    if (socket) {
                        socket.disconnect();
                    }
                }
            }
            this.io.emit('heartbeat', { timestamp: now });
        }, config_1.config.websocket.heartbeatInterval);
    }
    emitDeploymentStarted(deployment) {
        const event = {
            type: SocketEventType.DEPLOYMENT_STARTED,
            payload: deployment,
            timestamp: new Date(),
            projectId: deployment.projectId,
            deploymentId: deployment.id
        };
        this.io.to(`project:${deployment.projectId}`).emit('event', event);
        logger_1.logger.debug(`Emitted deployment started event for ${deployment.id}`);
    }
    emitDeploymentUpdated(deployment) {
        const event = {
            type: SocketEventType.DEPLOYMENT_UPDATED,
            payload: deployment,
            timestamp: new Date(),
            projectId: deployment.projectId,
            deploymentId: deployment.id
        };
        this.io.to(`project:${deployment.projectId}`).emit('event', event);
        this.io.to(`deployment:${deployment.id}`).emit('event', event);
    }
    emitDeploymentCompleted(deployment) {
        const event = {
            type: SocketEventType.DEPLOYMENT_COMPLETED,
            payload: deployment,
            timestamp: new Date(),
            projectId: deployment.projectId,
            deploymentId: deployment.id
        };
        this.io.to(`project:${deployment.projectId}`).emit('event', event);
        this.io.to(`deployment:${deployment.id}`).emit('event', event);
    }
    emitDeploymentFailed(deployment) {
        const event = {
            type: SocketEventType.DEPLOYMENT_FAILED,
            payload: deployment,
            timestamp: new Date(),
            projectId: deployment.projectId,
            deploymentId: deployment.id
        };
        this.io.to(`project:${deployment.projectId}`).emit('event', event);
        this.io.to(`deployment:${deployment.id}`).emit('event', event);
    }
    emitStepStarted(step, deploymentId, projectId) {
        const event = {
            type: SocketEventType.STEP_STARTED,
            payload: step,
            timestamp: new Date(),
            projectId,
            deploymentId
        };
        this.io.to(`deployment:${deploymentId}`).emit('event', event);
    }
    emitStepUpdated(step, deploymentId, projectId) {
        const event = {
            type: SocketEventType.STEP_UPDATED,
            payload: step,
            timestamp: new Date(),
            projectId,
            deploymentId
        };
        this.io.to(`deployment:${deploymentId}`).emit('event', event);
    }
    emitStepCompleted(step, deploymentId, projectId) {
        const event = {
            type: SocketEventType.STEP_COMPLETED,
            payload: step,
            timestamp: new Date(),
            projectId,
            deploymentId
        };
        this.io.to(`deployment:${deploymentId}`).emit('event', event);
    }
    emitStepFailed(step, deploymentId, projectId) {
        const event = {
            type: SocketEventType.STEP_FAILED,
            payload: step,
            timestamp: new Date(),
            projectId,
            deploymentId
        };
        this.io.to(`deployment:${deploymentId}`).emit('event', event);
    }
    emitStepRetrying(step, deploymentId, projectId) {
        const event = {
            type: SocketEventType.STEP_RETRYING,
            payload: step,
            timestamp: new Date(),
            projectId,
            deploymentId
        };
        this.io.to(`deployment:${deploymentId}`).emit('event', event);
    }
    emitLogEntry(log, deploymentId, projectId) {
        const event = {
            type: SocketEventType.LOG_ENTRY,
            payload: log,
            timestamp: new Date(),
            projectId: projectId || log.projectId,
            deploymentId: deploymentId || log.deploymentId
        };
        if (deploymentId || log.deploymentId) {
            this.io.to(`deployment:${deploymentId || log.deploymentId}`).emit('event', event);
        }
        if (projectId || log.projectId) {
            this.io.to(`project:${projectId || log.projectId}`).emit('event', event);
        }
    }
    emitSystemAlert(alert) {
        const event = {
            type: SocketEventType.SYSTEM_ALERT,
            payload: alert,
            timestamp: new Date()
        };
        this.io.emit('event', event);
    }
    emitMetricsUpdate(metrics) {
        const event = {
            type: SocketEventType.METRICS_UPDATE,
            payload: metrics,
            timestamp: new Date(),
            projectId: metrics.projectId,
            deploymentId: metrics.deploymentId
        };
        if (metrics.deploymentId) {
            this.io.to(`deployment:${metrics.deploymentId}`).emit('event', event);
        }
        if (metrics.projectId) {
            this.io.to(`project:${metrics.projectId}`).emit('event', event);
        }
    }
    emitStepUpdate(stepData) {
        const event = {
            type: SocketEventType.STEP_UPDATED,
            payload: stepData,
            timestamp: new Date(),
            projectId: stepData.projectId,
            deploymentId: stepData.deploymentId
        };
        this.io.to(`deployment:${stepData.deploymentId}`).emit('event', event);
        this.io.to(`project:${stepData.projectId}`).emit('event', event);
    }
    getConnectedUserCount() {
        return this.userSockets.size;
    }
    getConnectedSocketCount() {
        return this.connectedUsers.size;
    }
    isUserConnected(userId) {
        return this.userSockets.has(userId);
    }
    getUserSocketIds(userId) {
        const socketSet = this.userSockets.get(userId);
        return socketSet ? Array.from(socketSet) : [];
    }
    async close() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        this.io.disconnectSockets(true);
        this.connectedUsers.clear();
        this.userSockets.clear();
        logger_1.logger.info('Socket service closed');
    }
}
exports.SocketService = SocketService;
//# sourceMappingURL=socket.service.js.map