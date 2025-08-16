import { connectDatabase } from '../database/connection';
import { sequelize } from '../database/sequelize';
import { logger } from '../utils/logger';

// 初始化数据库表结构
const initializeTables = async (conn: any): Promise<void> => {
  try {
    logger.info('🔧 Initializing database tables...')

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

    // 创建项目表
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uuid VARCHAR(36) UNIQUE NOT NULL,
        name VARCHAR(100) UNIQUE NOT NULL,
        display_name VARCHAR(200) NOT NULL,
        description TEXT,
        repository VARCHAR(255) NOT NULL,
        branch VARCHAR(100) NOT NULL DEFAULT 'main',
        deploy_type ENUM('static', 'backend') NOT NULL DEFAULT 'static',
        status ENUM('active', 'inactive', 'maintenance') NOT NULL DEFAULT 'active',
        
        -- 部署配置
        deploy_path VARCHAR(255) NOT NULL,
        nginx_config TEXT,
        start_command VARCHAR(500),
        environment_variables TEXT,
        
        -- 运行状态
        is_running BOOLEAN NOT NULL DEFAULT FALSE,
        port INT,
        url VARCHAR(255),
        memory_usage INT,
        disk_usage INT,
        cpu_usage FLOAT,
        uptime INT,
        last_health_check TIMESTAMP NULL,
        
        -- 数据库状态
        has_mysql BOOLEAN NOT NULL DEFAULT FALSE,
        mysql_status ENUM('running', 'stopped', 'error'),
        mysql_backup_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        mysql_backup_schedule VARCHAR(100),
        mysql_backup_last TIMESTAMP NULL,
        mysql_backup_path VARCHAR(255),
        
        has_redis BOOLEAN NOT NULL DEFAULT FALSE,
        redis_status ENUM('running', 'stopped', 'error'),
        redis_port INT,
        
        -- 监控配置
        health_check_url VARCHAR(255),
        health_check_interval INT NOT NULL DEFAULT 300,
        auto_restart BOOLEAN NOT NULL DEFAULT TRUE,
        restart_threshold INT NOT NULL DEFAULT 3,
        
        -- 统计信息
        total_deployments INT NOT NULL DEFAULT 0,
        successful_deployments INT NOT NULL DEFAULT 0,
        failed_deployments INT NOT NULL DEFAULT 0,
        last_deployment TIMESTAMP NULL,
        average_deployment_time INT NOT NULL DEFAULT 0,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_uuid (uuid),
        INDEX idx_name (name),
        INDEX idx_status (status),
        INDEX idx_deploy_type (deploy_type),
        INDEX idx_is_running (is_running)
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
        uuid VARCHAR(36) UNIQUE NOT NULL,
        deployment_uuid VARCHAR(36) NOT NULL,
        step_name VARCHAR(100) NOT NULL,
        display_name VARCHAR(200) NOT NULL,
        step_order INT NOT NULL,
        step_type ENUM('validation', 'deployment', 'configuration', 'service', 'testing', 'backup', 'cleanup') NOT NULL,
        status ENUM('pending', 'running', 'success', 'failed', 'skipped', 'cancelled') DEFAULT 'pending',
        
        -- 时间信息
        start_time TIMESTAMP NULL,
        end_time TIMESTAMP NULL,
        duration INT DEFAULT 0,
        
        -- 进度信息
        progress INT DEFAULT 0,
        total_steps INT,
        current_step INT,
        
        -- 日志和错误
        logs TEXT,
        error_message TEXT,
        error_code VARCHAR(50),
        
        -- 步骤配置
        is_required BOOLEAN DEFAULT TRUE,
        can_retry BOOLEAN DEFAULT TRUE,
        retry_count INT DEFAULT 0,
        max_retries INT DEFAULT 3,
        
        -- 依赖关系
        depends_on VARCHAR(500),
        
        -- 步骤结果
        result_data TEXT,
        artifacts TEXT,
        
        -- 元数据
        metadata TEXT,
        
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_uuid (uuid),
        INDEX idx_deployment (deployment_uuid),
        INDEX idx_step_name (step_name),
        INDEX idx_status (status),
        INDEX idx_step_order (step_order),
        INDEX idx_step_type (step_type),
        FOREIGN KEY (deployment_uuid) REFERENCES deployments(uuid) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 创建项目配置表
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS project_configs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_name VARCHAR(100) NOT NULL,
        config_key VARCHAR(100) NOT NULL,
        config_value TEXT,
        config_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_project_config (project_name, config_key),
        INDEX idx_project (project_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 创建系统监控记录表
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS system_monitoring (
        id INT AUTO_INCREMENT PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        cpu_usage FLOAT,
        memory_usage INT,
        disk_usage INT,
        network_in BIGINT,
        network_out BIGINT,
        active_connections INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_timestamp (timestamp)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 创建项目监控记录表
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS project_monitoring (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_name VARCHAR(100) NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_running BOOLEAN,
        memory_usage INT,
        cpu_usage FLOAT,
        response_time INT,
        status_code INT,
        error_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_project_timestamp (project_name, timestamp),
        INDEX idx_timestamp (timestamp)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    logger.info('✅ Database tables initialized successfully');
  } catch (error) {
    logger.error('❌ Failed to initialize database tables:', error);
    throw error;
  }
};

// 插入初始数据
const insertInitialData = async (conn: any): Promise<void> => {
  try {
    logger.info('📝 Inserting initial data...');

    // 检查是否已有数据
    const [userCount] = await conn.execute('SELECT COUNT(*) as count FROM users') as any;
    if (userCount[0].count > 0) {
      logger.info('ℹ️ Users table already has data, skipping initial data insertion');
      return;
    }

    // 插入默认管理员用户
    await conn.execute(`
      INSERT INTO users (uuid, username, email, password_hash, is_active, created_at, updated_at)
      VALUES (
        UUID(),
        'admin',
        'admin@example.com',
        '$2b$10$rQZ8K9mN2pL1vX3yW4uJ5t.6s7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p',
        TRUE,
        NOW(),
        NOW()
      )
    `);

    // 插入示例项目数据
    await conn.execute(`
      INSERT INTO projects (
        uuid, name, display_name, description, repository, branch, deploy_type, status,
        deploy_path, has_mysql, has_redis, health_check_interval, auto_restart, restart_threshold,
        created_at, updated_at
      ) VALUES (
        UUID(),
        'axi-project-dashboard',
        '项目部署监控中心',
        '云端部署监控和管理系统',
        'MoseLu/axi-project-dashboard',
        'main',
        'backend',
        'active',
        '/srv/apps/axi-project-dashboard',
        TRUE,
        TRUE,
        300,
        TRUE,
        3,
        NOW(),
        NOW()
      )
    `);

    await conn.execute(`
      INSERT INTO projects (
        uuid, name, display_name, description, repository, branch, deploy_type, status,
        deploy_path, has_mysql, has_redis, health_check_interval, auto_restart, restart_threshold,
        created_at, updated_at
      ) VALUES (
        UUID(),
        'axi-star-cloud',
        '星云文件管理系统',
        '基于Go的文件管理和分享系统',
        'MoseLu/axi-star-cloud',
        'main',
        'backend',
        'active',
        '/srv/apps/axi-star-cloud',
        TRUE,
        TRUE,
        300,
        TRUE,
        3,
        NOW(),
        NOW()
      )
    `);

    await conn.execute(`
      INSERT INTO projects (
        uuid, name, display_name, description, repository, branch, deploy_type, status,
        deploy_path, has_mysql, has_redis, health_check_interval, auto_restart, restart_threshold,
        created_at, updated_at
      ) VALUES (
        UUID(),
        'axi-docs',
        '文档中心',
        '项目文档和知识库',
        'MoseLu/axi-docs',
        'main',
        'static',
        'active',
        '/srv/static/axi-docs',
        FALSE,
        FALSE,
        300,
        TRUE,
        3,
        NOW(),
        NOW()
      )
    `);

    logger.info('✅ Initial data inserted successfully');
  } catch (error) {
    logger.error('❌ Failed to insert initial data:', error);
    throw error;
  }
};

// 主初始化函数
const initializeDatabase = async (): Promise<void> => {
  let conn;
  
  try {
    logger.info('🚀 Starting database initialization...');
    
    // 连接数据库
    conn = await connectDatabase();
    logger.info('✅ Database connection established');
    
    // 初始化表结构
    await initializeTables(conn);
    
    // 插入初始数据
    await insertInitialData(conn);
    
    logger.info('🎉 Database initialization completed successfully');
  } catch (error) {
    logger.error('❌ Database initialization failed:', error);
    throw error;
  } finally {
    if (conn) {
      await conn.end();
    }
  }
};

// 如果直接运行此脚本
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      logger.info('✅ Database initialization completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ Database initialization failed:', error);
      process.exit(1);
    });
}

export default initializeDatabase;
