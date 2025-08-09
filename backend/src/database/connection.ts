import mysql from 'mysql2/promise';
import { config } from '@/config/config';
import { logger } from '@/utils/logger';

let connection: mysql.Connection | null = null;

export const connectDatabase = async (): Promise<mysql.Connection> => {
  try {
    const mysqlConfig = {
      host: config.database.mysql.host,
      port: config.database.mysql.port,
      user: config.database.mysql.user,
      password: config.database.mysql.password,
      database: config.database.mysql.database,
      charset: 'utf8mb4',
      timezone: '+08:00',
      connectionLimit: 10,
      acquireTimeout: 60000,
      timeout: 60000,
    };

    // 首先检查数据库是否存在，如果不存在则创建
    const tempConnection = await mysql.createConnection({
      host: mysqlConfig.host,
      port: mysqlConfig.port,
      user: mysqlConfig.user,
      password: mysqlConfig.password,
      charset: mysqlConfig.charset,
      timezone: mysqlConfig.timezone,
    });

    // 创建数据库（如果不存在）
    await tempConnection.execute(
      `CREATE DATABASE IF NOT EXISTS \`${mysqlConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await tempConnection.end();

    // 连接到指定数据库
    connection = await mysql.createConnection(mysqlConfig);
    
    logger.info('✅ MySQL connected successfully');
    logger.info(`📊 Database: ${mysqlConfig.database}`);
    logger.info(`🏠 Host: ${mysqlConfig.host}:${mysqlConfig.port}`);
    
    // 创建必要的表结构
    await initializeTables(connection);
    
    return connection;
  } catch (error) {
    logger.error('❌ Failed to connect to MySQL:', error);
    throw error;
  }
};

export const getConnection = (): mysql.Connection => {
  if (!connection) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return connection;
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    if (connection) {
      await connection.end();
      connection = null;
      logger.info('✅ MySQL disconnected successfully');
    }
  } catch (error) {
    logger.error('❌ Error disconnecting from MySQL:', error);
    throw error;
  }
};

// 初始化数据库表结构
const initializeTables = async (conn: mysql.Connection): Promise<void> => {
  try {
    logger.info('🔧 Initializing database tables...');

    // 创建用户表
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

    // 创建部署记录表
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

    // 创建部署步骤表
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

    // 创建项目配置表
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

    // 创建系统设置表
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

    // 插入默认管理员用户
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

    logger.info('✅ Database tables initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize database tables:', error);
    throw error;
  }
};
