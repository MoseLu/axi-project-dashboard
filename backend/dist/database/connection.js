"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDatabase = exports.getConnection = exports.connectDatabase = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const config_1 = require("@/config/config");
const logger_1 = require("@/utils/logger");
let connection = null;
const connectDatabase = async () => {
    try {
        const mysqlConfig = {
            host: config_1.config.database.mysql.host,
            port: config_1.config.database.mysql.port,
            user: config_1.config.database.mysql.user,
            password: config_1.config.database.mysql.password,
            database: config_1.config.database.mysql.database,
            charset: 'utf8mb4',
            timezone: '+08:00',
            connectionLimit: 10,
            acquireTimeout: 60000,
            timeout: 60000,
        };
        const tempConnection = await promise_1.default.createConnection({
            host: mysqlConfig.host,
            port: mysqlConfig.port,
            user: mysqlConfig.user,
            password: mysqlConfig.password,
            charset: mysqlConfig.charset,
            timezone: mysqlConfig.timezone,
        });
        await tempConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${mysqlConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        await tempConnection.end();
        connection = await promise_1.default.createConnection(mysqlConfig);
        logger_1.logger.info('✅ MySQL connected successfully');
        logger_1.logger.info(`📊 Database: ${mysqlConfig.database}`);
        logger_1.logger.info(`🏠 Host: ${mysqlConfig.host}:${mysqlConfig.port}`);
        await initializeTables(connection);
        return connection;
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to connect to MySQL:', error);
        throw error;
    }
};
exports.connectDatabase = connectDatabase;
const getConnection = () => {
    if (!connection) {
        throw new Error('Database not connected. Call connectDatabase() first.');
    }
    return connection;
};
exports.getConnection = getConnection;
const disconnectDatabase = async () => {
    try {
        if (connection) {
            await connection.end();
            connection = null;
            logger_1.logger.info('✅ MySQL disconnected successfully');
        }
    }
    catch (error) {
        logger_1.logger.error('❌ Error disconnecting from MySQL:', error);
        throw error;
    }
};
exports.disconnectDatabase = disconnectDatabase;
const initializeTables = async (conn) => {
    try {
        logger_1.logger.info('🔧 Initializing database tables...');
        await conn.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uuid VARCHAR(36) UNIQUE NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        avatar_url VARCHAR(255),
        bio TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        last_login_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_uuid (uuid),
        INDEX idx_username (username),
        INDEX idx_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        await conn.execute(`
      CREATE TABLE IF NOT EXISTS deployments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uuid VARCHAR(36) UNIQUE NOT NULL,
        project_name VARCHAR(100) NOT NULL,
        repository VARCHAR(255) NOT NULL,
        branch VARCHAR(100) NOT NULL,
        commit_hash VARCHAR(40) NOT NULL,
        status ENUM('pending', 'running', 'success', 'failed', 'cancelled') DEFAULT 'pending',
        start_time TIMESTAMP NULL,
        end_time TIMESTAMP NULL,
        duration INT DEFAULT 0,
        triggered_by VARCHAR(50),
        trigger_type ENUM('push', 'manual', 'schedule') DEFAULT 'manual',
        logs TEXT,
        metadata JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_uuid (uuid),
        INDEX idx_project (project_name),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        await conn.execute(`
      CREATE TABLE IF NOT EXISTS deployment_steps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        deployment_uuid VARCHAR(36) NOT NULL,
        step_name VARCHAR(100) NOT NULL,
        step_order INT NOT NULL,
        status ENUM('pending', 'running', 'success', 'failed', 'skipped') DEFAULT 'pending',
        start_time TIMESTAMP NULL,
        end_time TIMESTAMP NULL,
        duration INT DEFAULT 0,
        logs TEXT,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_deployment (deployment_uuid),
        INDEX idx_status (status),
        FOREIGN KEY (deployment_uuid) REFERENCES deployments(uuid) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        await conn.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uuid VARCHAR(36) UNIQUE NOT NULL,
        name VARCHAR(100) UNIQUE NOT NULL,
        repository VARCHAR(255) NOT NULL,
        default_branch VARCHAR(100) DEFAULT 'main',
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        deploy_config JSON,
        webhook_secret VARCHAR(255),
        last_deploy_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_uuid (uuid),
        INDEX idx_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        await conn.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        key_name VARCHAR(100) UNIQUE NOT NULL,
        value_data JSON,
        description TEXT,
        is_public BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_key (key_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        await conn.execute(`
      INSERT IGNORE INTO users (uuid, username, email, password_hash, bio, is_active)
      VALUES (
        '550e8400-e29b-41d4-a716-446655440000',
        'admin',
        'admin@axi-deploy.com',
        '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        'AXI Deploy Dashboard Administrator',
        TRUE
      )
    `);
        logger_1.logger.info('✅ Database tables initialized successfully');
    }
    catch (error) {
        logger_1.logger.error('❌ Failed to initialize database tables:', error);
        throw error;
    }
};
//# sourceMappingURL=connection.js.map