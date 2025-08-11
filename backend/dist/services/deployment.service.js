"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeploymentService = void 0;
const deployment_1 = require("../database/models/deployment");
const logger_1 = require("../utils/logger");
const sequelize_1 = require("sequelize");
class DeploymentService {
    constructor(socketService) {
        this.socketService = socketService;
    }
    async createDeployment(data) {
        try {
            const deploymentData = {
                project_name: data.project_name,
                repository: data.repository,
                branch: data.branch,
                commit_hash: data.commit_hash,
                status: data.status,
                duration: data.duration,
                trigger_type: data.trigger_type,
            };
            if (data.start_time !== undefined)
                deploymentData.start_time = data.start_time;
            if (data.end_time !== undefined)
                deploymentData.end_time = data.end_time;
            if (data.triggered_by !== undefined)
                deploymentData.triggered_by = data.triggered_by;
            if (data.logs !== undefined)
                deploymentData.logs = data.logs;
            if (data.metadata !== undefined)
                deploymentData.metadata = data.metadata;
            const deployment = await deployment_1.Deployment.create(deploymentData);
            logger_1.logger.info(`Created deployment record: ${deployment.id} for project: ${data.project_name}`);
            this.socketService.emitDeploymentStarted({
                id: deployment.id.toString(),
                projectId: data.project_name,
                ...data,
            });
            return deployment;
        }
        catch (error) {
            logger_1.logger.error('Failed to create deployment record:', error);
            throw error;
        }
    }
    async updateDeploymentStatus(id, status, duration, errorMessage) {
        try {
            const deployment = await deployment_1.Deployment.findByPk(id);
            if (!deployment) {
                logger_1.logger.warn(`Deployment not found: ${id}`);
                return null;
            }
            const updateData = { status };
            if (duration !== undefined) {
                updateData.duration = duration;
            }
            if (errorMessage !== undefined) {
                updateData.errorMessage = errorMessage;
            }
            await deployment.update(updateData);
            logger_1.logger.info(`Updated deployment ${id} status to: ${status}`);
            if (status === 'success') {
                this.socketService.emitDeploymentCompleted({
                    id: deployment.id.toString(),
                    projectId: deployment.project_name,
                    status: deployment.status,
                    duration: deployment.duration,
                    timestamp: deployment.end_time || deployment.start_time || deployment.created_at,
                });
            }
            else if (status === 'failed') {
                this.socketService.emitDeploymentFailed({
                    id: deployment.id.toString(),
                    projectId: deployment.project_name,
                    status: deployment.status,
                    duration: deployment.duration,
                    timestamp: deployment.end_time || deployment.start_time || deployment.created_at,
                    errorMessage: deployment.metadata?.errorMessage || '',
                });
            }
            else {
                this.socketService.emitDeploymentUpdated({
                    id: deployment.id.toString(),
                    projectId: deployment.project_name,
                    status: deployment.status,
                    duration: deployment.duration,
                    timestamp: deployment.end_time || deployment.start_time || deployment.created_at,
                });
            }
            return deployment;
        }
        catch (error) {
            logger_1.logger.error(`Failed to update deployment ${id}:`, error);
            throw error;
        }
    }
    async getRecentDeployments(limit = 10) {
        try {
            const deployments = await deployment_1.Deployment.findAll({
                order: [['created_at', 'DESC']],
                limit,
            });
            return deployments;
        }
        catch (error) {
            logger_1.logger.error('Failed to get recent deployments:', error);
            throw error;
        }
    }
    async getDeploymentsWithPagination(params) {
        try {
            const { page, limit, sortBy, sortOrder, project, status } = params;
            const offset = (page - 1) * limit;
            const whereClause = {};
            if (project) {
                whereClause.project_name = project;
            }
            if (status) {
                whereClause.status = status;
            }
            const allowedSortFields = ['created_at', 'project_name', 'status', 'duration', 'start_time', 'end_time'];
            const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
            const validSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';
            const total = await deployment_1.Deployment.count({ where: whereClause });
            const deployments = await deployment_1.Deployment.findAll({
                where: whereClause,
                order: [[validSortBy, validSortOrder]],
                limit,
                offset,
            });
            const totalPages = Math.ceil(total / limit);
            return {
                data: deployments,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1,
                },
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get deployments with pagination:', error);
            throw error;
        }
    }
    async getDeploymentMetrics() {
        try {
            const [totalDeployments, successfulDeployments, failedDeployments, averageTimeResult,] = await Promise.all([
                deployment_1.Deployment.count(),
                deployment_1.Deployment.count({ where: { status: 'success' } }),
                deployment_1.Deployment.count({ where: { status: 'failed' } }),
                deployment_1.Deployment.findOne({
                    attributes: [[deployment_1.Deployment.sequelize.fn('AVG', deployment_1.Deployment.sequelize.col('duration')), 'averageTime']],
                    where: { status: { [sequelize_1.Op.in]: ['success', 'failed'] } },
                }),
            ]);
            const averageDeploymentTime = averageTimeResult
                ? Math.round(parseFloat(averageTimeResult.get('averageTime')) || 0)
                : 0;
            const metrics = {
                totalDeployments,
                successfulDeployments,
                failedDeployments,
                averageDeploymentTime,
            };
            return metrics;
        }
        catch (error) {
            logger_1.logger.error('Failed to get deployment metrics:', error);
            throw error;
        }
    }
    async getProjectDeployments(project, limit = 20) {
        try {
            const deployments = await deployment_1.Deployment.findAll({
                where: { project_name: project },
                order: [['created_at', 'DESC']],
                limit,
            });
            return deployments;
        }
        catch (error) {
            logger_1.logger.error(`Failed to get deployments for project ${project}:`, error);
            throw error;
        }
    }
    async cleanupOldDeployments() {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const result = await deployment_1.Deployment.destroy({
                where: {
                    created_at: {
                        [sequelize_1.Op.lt]: thirtyDaysAgo,
                    },
                },
            });
            logger_1.logger.info(`Cleaned up ${result} old deployment records`);
            return result;
        }
        catch (error) {
            logger_1.logger.error('Failed to cleanup old deployments:', error);
            throw error;
        }
    }
    async handleDeploymentWebhook(data) {
        try {
            const { type, project, status, duration, timestamp, sourceRepo, runId, deployType, serverHost, logs, errorMessage, deployment_id, step_name, step_status, workflow_name, workflow_id, log_stream_id, level, message, metrics, } = data;
            switch (type) {
                case 'step_started':
                case 'step_completed':
                case 'step_manual':
                    await this.handleStepNotification(data);
                    break;
                case 'deployment_completed':
                    await this.handleDeploymentCompletion(data);
                    break;
                case 'log_entry':
                    await this.handleLogEntry(data);
                    break;
                case 'metrics_update':
                    await this.handleMetricsUpdate(data);
                    break;
                default:
                    if (!project || !status) {
                        logger_1.logger.warn('Invalid deployment webhook data:', data);
                        return;
                    }
                    const deploymentData = {
                        project_name: project,
                        repository: sourceRepo || project,
                        branch: 'main',
                        commit_hash: runId || 'unknown',
                        status: status === 'success' ? 'success' : status === 'failed' ? 'failed' : 'running',
                        duration: duration || 0,
                        trigger_type: 'push',
                        logs,
                        metadata: {
                            deployType,
                            serverHost,
                            errorMessage,
                            originalTimestamp: timestamp
                        }
                    };
                    await this.createDeployment(deploymentData);
                    logger_1.logger.info(`Processed deployment webhook for project: ${project}`);
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to handle deployment webhook:', error);
            throw error;
        }
    }
    async handleStepNotification(data) {
        const { project, deployment_id, step_name, step_status, timestamp, workflow_name, workflow_id, logs, duration, started_at, completed_at, } = data;
        logger_1.logger.info(`Processing step notification: ${step_name} (${step_status}) for project: ${project}`);
        this.socketService.emitStepUpdate({
            projectId: project,
            deploymentId: deployment_id,
            stepName: step_name,
            status: step_status,
            timestamp,
            workflowName: workflow_name,
            workflowId: workflow_id,
            logs,
            duration,
            startedAt: started_at,
            completedAt: completed_at,
        });
    }
    async handleDeploymentCompletion(data) {
        const { project, deployment_id, status, timestamp, workflow_name, workflow_id, logs, duration, started_at, completed_at, } = data;
        logger_1.logger.info(`Processing deployment completion: ${deployment_id} (${status}) for project: ${project}`);
        this.socketService.emitDeploymentCompleted({
            id: deployment_id,
            projectId: project,
            status,
            duration,
            timestamp,
            workflowName: workflow_name,
            workflowId: workflow_id,
            logs,
            startedAt: started_at,
            completedAt: completed_at,
        });
    }
    async handleLogEntry(data) {
        const { project, deployment_id, log_stream_id, timestamp, level, message, source, } = data;
        logger_1.logger.debug(`Processing log entry: ${level} for deployment: ${deployment_id}`);
        this.socketService.emitLogEntry({
            projectId: project,
            deploymentId: deployment_id,
            logStreamId: log_stream_id,
            level,
            message,
            timestamp,
            source,
        });
    }
    async handleMetricsUpdate(data) {
        const { project, deployment_id, timestamp, metrics, } = data;
        logger_1.logger.info(`Processing metrics update for deployment: ${deployment_id}`);
        this.socketService.emitMetricsUpdate({
            projectId: project,
            deploymentId: deployment_id,
            metrics,
            timestamp,
        });
    }
}
exports.DeploymentService = DeploymentService;
//# sourceMappingURL=deployment.service.js.map