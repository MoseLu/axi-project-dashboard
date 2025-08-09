"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = exports.requireRole = exports.optionalAuthMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("@/config/config");
const error_middleware_1 = require("@/middleware/error.middleware");
const logger_1 = require("@/utils/logger");
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new error_middleware_1.ApiError('Access denied. No token provided.', 401);
        }
        const token = authHeader.substring(7);
        if (!token) {
            throw new error_middleware_1.ApiError('Access denied. No token provided.', 401);
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
            req.user = decoded;
            next();
        }
        catch (jwtError) {
            logger_1.logger.warn('Invalid JWT token:', jwtError);
            throw new error_middleware_1.ApiError('Invalid token.', 401);
        }
    }
    catch (error) {
        next(error);
    }
};
exports.authMiddleware = authMiddleware;
const optionalAuthMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
            const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
            req.user = decoded;
        }
        catch (jwtError) {
            logger_1.logger.debug('Optional auth: Invalid token ignored');
        }
    }
    next();
};
exports.optionalAuthMiddleware = optionalAuthMiddleware;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new error_middleware_1.ApiError('Access denied. Authentication required.', 401);
        }
        if (!roles.includes(req.user.role)) {
            throw new error_middleware_1.ApiError('Access denied. Insufficient permissions.', 403);
        }
        next();
    };
};
exports.requireRole = requireRole;
const generateToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, config_1.config.jwt.secret, {
        expiresIn: config_1.config.jwt.expiresIn
    });
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    return jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret);
};
exports.verifyToken = verifyToken;
//# sourceMappingURL=auth.middleware.js.map