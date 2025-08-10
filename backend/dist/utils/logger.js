"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const config_1 = require("../config/config");
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
}), winston_1.default.format.errors({ stack: true }), winston_1.default.format.printf(({ level, message, timestamp, stack }) => {
    if (stack) {
        return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
}));
const transports = [
    new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.colorize(), logFormat)
    })
];
if (config_1.config.env === 'production') {
    transports.push(new winston_1.default.transports.File({
        filename: `${config_1.config.logging.filePath}/error.log`,
        level: 'error',
        format: logFormat,
        maxsize: 10 * 1024 * 1024,
        maxFiles: 5
    }), new winston_1.default.transports.File({
        filename: `${config_1.config.logging.filePath}/combined.log`,
        format: logFormat,
        maxsize: 10 * 1024 * 1024,
        maxFiles: 5
    }));
}
exports.logger = winston_1.default.createLogger({
    level: config_1.config.logging.level,
    format: logFormat,
    transports,
    exitOnError: false
});
exports.logger.exceptions.handle(new winston_1.default.transports.Console({
    format: winston_1.default.format.combine(winston_1.default.format.colorize(), logFormat)
}));
process.on('unhandledRejection', (reason, promise) => {
    exports.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
exports.default = exports.logger;
//# sourceMappingURL=logger.js.map