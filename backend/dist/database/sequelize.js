"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeConnection = exports.syncDatabase = exports.testConnection = exports.sequelize = void 0;
const sequelize_1 = require("sequelize");
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
exports.sequelize = new sequelize_1.Sequelize({
    dialect: 'mysql',
    host: config_1.config.database.mysql.host,
    port: config_1.config.database.mysql.port,
    username: config_1.config.database.mysql.user,
    password: config_1.config.database.mysql.password,
    database: config_1.config.database.mysql.database,
    timezone: '+08:00',
    logging: (msg) => logger_1.logger.debug(msg),
    pool: {
        max: 10,
        min: 0,
        acquire: 10000,
        idle: 10000,
    },
    define: {
        timestamps: true,
        underscored: false,
        freezeTableName: true,
    },
});
const testConnection = async () => {
    try {
        await exports.sequelize.authenticate();
        logger_1.logger.info('✅ Sequelize database connection established successfully');
    }
    catch (error) {
        logger_1.logger.error('❌ Unable to connect to the database:', error);
        throw error;
    }
};
exports.testConnection = testConnection;
const syncDatabase = async () => {
    try {
        await exports.sequelize.sync({ alter: true });
        logger_1.logger.info('✅ Database models synchronized successfully');
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to sync database models:', error);
        throw error;
    }
};
exports.syncDatabase = syncDatabase;
const closeConnection = async () => {
    try {
        await exports.sequelize.close();
        logger_1.logger.info('✅ Sequelize database connection closed successfully');
    }
    catch (error) {
        logger_1.logger.error('❌ Error closing database connection:', error);
        throw error;
    }
};
exports.closeConnection = closeConnection;
//# sourceMappingURL=sequelize.js.map