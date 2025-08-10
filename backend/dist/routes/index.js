"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routes = void 0;
const express_1 = require("express");
const logger_1 = require("../utils/logger");
const router = (0, express_1.Router)();
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
router.get('/deployments', (req, res) => {
    res.json({
        success: true,
        message: 'Deployments endpoint - Coming soon!',
        data: []
    });
});
router.get('/projects', (req, res) => {
    res.json({
        success: true,
        message: 'Projects endpoint - Coming soon!',
        data: []
    });
});
router.get('/metrics', (req, res) => {
    res.json({
        success: true,
        message: 'Metrics endpoint - Coming soon!',
        data: {
            totalDeployments: 0,
            successfulDeployments: 0,
            failedDeployments: 0,
            averageDeploymentTime: 0
        }
    });
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