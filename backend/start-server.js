#!/usr/bin/env node

const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 创建 Express 应用
const app = express();
const server = http.createServer(app);

// 简单的内存存储
const deploymentStore = {
  deployments: [],
  metrics: {
    totalDeployments: 0,
    successfulDeployments: 0,
    failedDeployments: 0,
    averageDeploymentTime: 0
  }
};

// 添加部署记录的函数
function addDeployment(project, status, duration = 0) {
  const deployment = {
    id: Date.now(),
    project,
    status,
    duration,
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  
  deploymentStore.deployments.unshift(deployment); // 添加到开头
  deploymentStore.deployments = deploymentStore.deployments.slice(0, 50); // 只保留最近50条
  
  // 更新指标
  deploymentStore.metrics.totalDeployments++;
  if (status === 'success') {
    deploymentStore.metrics.successfulDeployments++;
  } else {
    deploymentStore.metrics.failedDeployments++;
  }
  
  // 计算平均部署时间
  const successfulDeployments = deploymentStore.deployments.filter(d => d.status === 'success' && d.duration > 0);
  if (successfulDeployments.length > 0) {
    const totalTime = successfulDeployments.reduce((sum, d) => sum + d.duration, 0);
    deploymentStore.metrics.averageDeploymentTime = Math.round(totalTime / successfulDeployments.length);
  }
  
  console.log(`📊 部署记录已添加: ${project} - ${status}`);
}

// 中间件
app.use(helmet({
  contentSecurityPolicy: false  // 简化CSP配置
}));
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} [INFO]: ${req.method} ${req.path} - ${req.ip}`);
  next();
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'axi-project-dashboard API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 8090,
    services: {
      http: 'up',
      database: 'unknown',
      redis: 'unknown'
    }
  });
});

// API 根路径端点
app.get('/project-dashboard/api', (req, res) => {
  res.json({
    success: true,
    message: 'AXI Project Dashboard API',
    data: {
      name: 'axi-project-dashboard',
      description: 'Deployment progress visualization dashboard',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      port: process.env.PORT || 8081,
      endpoints: [
        'GET /project-dashboard/api/info',
        'GET /project-dashboard/api/deployments',
        'GET /project-dashboard/api/projects',
        'GET /project-dashboard/api/metrics',
        'POST /project-dashboard/api/auth/login',
        'GET /project-dashboard/api/auth/verify',
        'POST /project-dashboard/api/auth/logout',
        'POST /project-dashboard/api/webhooks/github'
      ]
    }
  });
});

// API 信息端点
app.get('/project-dashboard/api/info', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'axi-project-dashboard',
      description: 'Deployment progress visualization dashboard',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      port: process.env.PORT || 8081
    }
  });
});

// 部署状态端点
app.get('/project-dashboard/api/deployments', (req, res) => {
  res.json({
    success: true,
    message: 'Deployments retrieved successfully',
    data: deploymentStore.deployments
  });
});

// 项目列表端点
app.get('/project-dashboard/api/projects', (req, res) => {
  const projects = [...new Set(deploymentStore.deployments.map(d => d.project))];
  res.json({
    success: true,
    message: 'Projects retrieved successfully',
    data: projects
  });
});

// 指标端点
app.get('/project-dashboard/api/metrics', (req, res) => {
  res.json({
    success: true,
    message: 'Metrics retrieved successfully',
    data: deploymentStore.metrics
  });
});

// 手动添加部署记录端点（用于测试）
app.post('/project-dashboard/api/deployments', (req, res) => {
  try {
    const { project, status, duration } = req.body;
    
    if (!project || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: project, status'
      });
    }
    
    addDeployment(project, status, duration || 0);
    
    res.json({
      success: true,
      message: 'Deployment record added successfully',
      data: { project, status, duration }
    });
  } catch (error) {
    console.error('添加部署记录时出错:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// 数据库连接函数
async function connectDatabase() {
  try {
    console.log('🔌 Attempting to connect to database...');
    
    // 直接连接到指定数据库
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '123456',
      database: 'project_dashboard',
      charset: 'utf8mb4',
      timezone: '+08:00',
      connectTimeout: 10000,
    });

    console.log('✅ Connected to project_dashboard database');

    // 创建用户表（如果不存在）
    await connection.execute(`
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

    // 插入默认管理员用户（如果不存在）
    await connection.execute(`
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

    console.log('✅ Database tables initialized');
    return connection;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

// 真实的登录接口
app.post('/project-dashboard/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('🔐 Login attempt:', { username, password: password ? '***' : 'undefined' });
    
    if (!username || !password) {
      console.log('❌ Missing username or password');
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    console.log('🔌 Connecting to database...');
    const conn = await connectDatabase();
    console.log('✅ Database connected for login');
    
    // 查询用户
    console.log('🔍 Querying user...');
    const [users] = await conn.execute(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, username]
    );

    if (!users || users.length === 0) {
      console.log('❌ User not found:', username);
      await conn.end();
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    const user = users[0];
    console.log('✅ User found:', user.username);

    // 验证密码
    console.log('🔐 Verifying password...');
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      console.log('❌ Invalid password for user:', username);
      await conn.end();
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 检查用户是否激活
    if (!user.is_active) {
      console.log('❌ User account disabled:', username);
      await conn.end();
      return res.status(403).json({
        success: false,
        message: '账户已被禁用'
      });
    }

    // 生成 JWT token
    console.log('🎫 Generating JWT token...');
    const token = jwt.sign(
      {
        id: user.id,
        uuid: user.uuid,
        username: user.username,
        email: user.email,
        role: user.role || 'user'
      },
      'your-super-secret-jwt-key',
      { expiresIn: '7d' }
    );

    // 更新最后登录时间
    await conn.execute(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
      [user.id]
    );

    await conn.end();

    console.log(`✅ User login successful: ${user.username}`);

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          uuid: user.uuid,
          username: user.username,
          email: user.email,
          avatar_url: user.avatar_url,
          role: user.role || 'user'
        }
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: '登录失败，请稍后重试',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Token验证接口
app.get('/project-dashboard/api/auth/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '缺少认证token'
      });
    }

    const token = authHeader.substring(7); // 移除 'Bearer ' 前缀
    
    // 验证JWT token
    const decoded = jwt.verify(token, 'your-super-secret-jwt-key');
    
    // 从数据库获取最新的用户信息
    const conn = await connectDatabase();
    const [users] = await conn.execute(
      'SELECT * FROM users WHERE id = ? AND is_active = TRUE',
      [decoded.id]
    );

    if (!users || users.length === 0) {
      await conn.end();
      return res.status(401).json({
        success: false,
        message: '用户不存在或已被禁用'
      });
    }

    const user = users[0];
    await conn.end();

    res.json({
      success: true,
      message: 'Token验证成功',
      data: {
        user: {
          id: user.id,
          uuid: user.uuid,
          username: user.username,
          email: user.email,
          avatar_url: user.avatar_url,
          role: user.role || 'user',
          is_active: user.is_active,
          last_login_at: user.last_login_at,
          created_at: user.created_at
        }
      }
    });
  } catch (error) {
    console.error('❌ Token验证失败:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token已过期，请重新登录'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: '无效的Token'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Token验证失败，请稍后重试'
    });
  }
});

// 退出登录接口
app.post('/project-dashboard/api/auth/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '缺少认证token'
      });
    }

    const token = authHeader.substring(7);
    
    // 验证JWT token
    const decoded = jwt.verify(token, 'your-super-secret-jwt-key');
    
    // 这里可以添加token黑名单逻辑，但目前简单返回成功
    console.log(`✅ User logout successful: ${decoded.username}`);
    
    res.json({
      success: true,
      message: '退出登录成功'
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      message: '退出登录失败，请稍后重试'
    });
  }
});

// GitHub Webhook 端点
app.post('/project-dashboard/api/webhooks/github', (req, res) => {
  console.log('GitHub webhook received:', {
    headers: req.headers,
    body: req.body
  });
  
  try {
    const { repository, workflow_run, action } = req.body;
    
    if (repository && workflow_run) {
      const project = repository.name;
      const status = workflow_run.conclusion === 'success' ? 'success' : 'failed';
      const duration = workflow_run.duration ? Math.round(workflow_run.duration / 1000) : 0; // 转换为秒
      
      addDeployment(project, status, duration);
      
      console.log(`📊 记录部署: ${project} - ${status} (${duration}s)`);
    }
  } catch (error) {
    console.error('处理 webhook 时出错:', error);
  }
  
  res.json({
    success: true,
    message: 'Webhook received successfully'
  });
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'GET /health',
      'GET /project-dashboard/api/info',
      'GET /project-dashboard/api/deployments',
      'GET /project-dashboard/api/projects',
      'GET /project-dashboard/api/metrics',
      'POST /project-dashboard/api/auth/login',
      'POST /project-dashboard/api/webhooks/github'
    ]
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 启动服务器
const port = process.env.PORT || 8082;
server.listen(port, async () => {
  console.log(`🚀 Server is running on port ${port}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API URL: http://localhost:${port}/project-dashboard/api`);
  console.log(`💚 Health Check: http://localhost:${port}/health`);
  console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || '*'}`);
  
  // 测试数据库连接
  try {
    console.log('🔌 Testing database connection...');
    const testConn = await connectDatabase();
    await testConn.end();
    console.log('✅ Database connection test successful');
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
  }
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// 错误处理
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
