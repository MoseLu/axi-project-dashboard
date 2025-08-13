"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.routes = void 0;
const express_1 = require("express");
const logger_1 = require("../utils/logger");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const router = (0, express_1.Router)();
router.use('/auth', auth_routes_1.default);
router.get('/health', (req, res) => {
    const response = {
        success: true,
        message: 'axi-project-dashboard API is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
    };
    res.json(response);
});
router.get('/info', (req, res) => {
    res.json({
        success: true,
        data: {
            name: 'axi-project-dashboard',
            description: 'Deployment progress visualization dashboard',
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            nodeVersion: process.version,
            platform: process.platform,
            uptime: process.uptime()
        }
    });
});
router.get('/deployments', async (req, res) => {
    try {
        const deploymentService = req.deploymentService;
        if (!deploymentService) {
            return res.status(503).json({
                success: false,
                message: 'Deployment service not available'
            });
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const sortBy = req.query.sortBy || 'timestamp';
        const sortOrder = req.query.sortOrder || 'DESC';
        const project = req.query.project;
        const status = req.query.status;
        const deployments = await deploymentService.getDeploymentsWithPagination({
            page,
            limit,
            sortBy,
            sortOrder,
            project,
            status
        });
        return res.json({
            success: true,
            message: 'Deployments data retrieved successfully',
            data: deployments.data,
            pagination: deployments.pagination
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get deployments:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get deployments',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/projects', (req, res) => {
    res.json({
        success: true,
        message: 'Projects endpoint - Coming soon!',
        data: []
    });
});
router.get('/metrics', async (req, res) => {
    try {
        const deploymentService = req.deploymentService;
        if (!deploymentService) {
            return res.status(503).json({
                success: false,
                message: 'Deployment service not available'
            });
        }
        const metrics = await deploymentService.getDeploymentMetrics();
        return res.json({
            success: true,
            message: 'Metrics data retrieved successfully',
            data: metrics
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to get metrics:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get metrics',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/webhooks/github', (req, res) => {
    logger_1.logger.info('GitHub webhook received:', {
        headers: req.headers,
        body: req.body
    });
    res.json({
        success: true,
        message: 'Webhook received successfully'
    });
});
router.post('/webhooks/deployment', async (req, res) => {
    try {
        logger_1.logger.info('Deployment webhook received:', {
            headers: req.headers,
            body: req.body
        });
        const deploymentService = req.deploymentService;
        if (!deploymentService) {
            return res.status(503).json({
                success: false,
                message: 'Deployment service not available'
            });
        }
        await deploymentService.handleDeploymentWebhook(req.body);
        return res.json({
            success: true,
            message: 'Deployment webhook processed successfully'
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to process deployment webhook:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to process deployment webhook',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: `API route ${req.originalUrl} not found`,
        availableRoutes: [
            'GET /api/health',
            'GET /api/info',
            'GET /api/deployments',
            'GET /api/projects',
            'GET /api/metrics',
            'POST /api/webhooks/github'
        ]
    });
});
exports.routes = router;
//# sourceMappingURL=index.js.map