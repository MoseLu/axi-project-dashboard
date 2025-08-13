import { connectDatabase } from '../database/connection';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';

const initializeDatabase = async () => {
  let conn;
  
  try {
    logger.info('🔧 开始初始化数据库...');
    
    conn = await connectDatabase();
    
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
        role ENUM('admin', 'user', 'viewer') DEFAULT 'user',
        is_active BOOLEAN DEFAULT TRUE,
        last_login_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_uuid (uuid),
        INDEX idx_username (username),
        INDEX idx_email (email),
        INDEX idx_role (role),
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    logger.info('✅ 用户表创建成功');
    
    // 检查是否已存在管理员账户
    const [existingAdmins] = await conn.execute(
      'SELECT id FROM users WHERE role = "admin" LIMIT 1'
    ) as any;
    
    if (!existingAdmins || existingAdmins.length === 0) {
      // 创建默认管理员账户
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash('admin123', saltRounds);
      
      await conn.execute(`
        INSERT INTO users (uuid, username, email, password_hash, role, is_active) 
        VALUES (UUID(), 'admin', 'admin@axi.com', ?, 'admin', TRUE)
      `, [passwordHash]);
      
      logger.info('✅ 默认管理员账户创建成功');
      logger.info('📋 默认登录信息:');
      logger.info('   用户名: admin');
      logger.info('   密码: admin123');
      logger.info('   邮箱: admin@axi.com');
    } else {
      logger.info('ℹ️  管理员账户已存在，跳过创建');
    }
    
    // 创建部署记录表（如果不存在）
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS deployments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uuid VARCHAR(36) UNIQUE NOT NULL,
        project_name VARCHAR(100) NOT NULL,
        project_id VARCHAR(100),
        status ENUM('pending', 'running', 'success', 'failed', 'cancelled') DEFAULT 'pending',
        environment VARCHAR(50),
        branch VARCHAR(100),
        commit_hash VARCHAR(40),
        commit_message TEXT,
        duration INT DEFAULT 0,
        logs TEXT,
        error_message TEXT,
        triggered_by VARCHAR(100),
        triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        started_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_uuid (uuid),
        INDEX idx_project_name (project_name),
        INDEX idx_status (status),
        INDEX idx_environment (environment),
        INDEX idx_triggered_at (triggered_at),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    logger.info('✅ 部署记录表创建成功');
    
    // 创建部署步骤表
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS deployment_steps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        deployment_id INT NOT NULL,
        step_name VARCHAR(100) NOT NULL,
        step_order INT NOT NULL,
        status ENUM('pending', 'running', 'success', 'failed', 'skipped') DEFAULT 'pending',
        duration INT DEFAULT 0,
        logs TEXT,
        error_message TEXT,
        started_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (deployment_id) REFERENCES deployments(id) ON DELETE CASCADE,
        INDEX idx_deployment_id (deployment_id),
        INDEX idx_step_order (step_order),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    logger.info('✅ 部署步骤表创建成功');
    
    // 创建项目表
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uuid VARCHAR(36) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        repository_url VARCHAR(255),
        repository_type ENUM('github', 'gitlab', 'bitbucket', 'other') DEFAULT 'github',
        default_branch VARCHAR(100) DEFAULT 'main',
        environments JSON,
        settings JSON,
        is_active BOOLEAN DEFAULT TRUE,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_uuid (uuid),
        INDEX idx_name (name),
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    logger.info('✅ 项目表创建成功');
    
    // 创建用户会话表（用于token黑名单）
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_token_hash (token_hash),
        INDEX idx_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    logger.info('✅ 用户会话表创建成功');
    
    logger.info('🎉 数据库初始化完成！');
    
  } catch (error) {
    logger.error('❌ 数据库初始化失败:', error);
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
      logger.info('✅ 数据库初始化脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('❌ 数据库初始化脚本执行失败:', error);
      process.exit(1);
    });
}

export default initializeDatabase;
