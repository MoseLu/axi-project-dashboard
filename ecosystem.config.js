module.exports = {
  apps: [
    {
      name: 'dashboard-backend',
      script: './backend/start-simple.js',
      cwd: '/srv/apps/axi-project-dashboard',
      instances: 1,
      exec_mode: 'fork',
      
      // 环境变量
      env: {
        NODE_ENV: 'production',
        PORT: 8090,          // Dashboard 专用端口，避免与业务项目冲突
        WEBSOCKET_PORT: 8091, // Dashboard WebSocket 专用端口
        
        // 数据库配置 (使用云服务器本地数据库)
        MYSQL_HOST: '127.0.0.1',
        MYSQL_PORT: '3306',
        MYSQL_USER: 'root',
        MYSQL_PASSWORD: '123456',
        MYSQL_DATABASE: 'project_dashboard',
        REDIS_URI: 'redis://localhost:6379',
        
        // 安全配置
        JWT_SECRET: process.env.JWT_SECRET || 'axi-deploy-dashboard-jwt-secret-2024',
        SESSION_SECRET: process.env.SESSION_SECRET || 'axi-deploy-dashboard-session-secret',
        
        // GitHub 集成
        GITHUB_TOKEN: process.env.GITHUB_TOKEN || '',
        GITHUB_WEBHOOK_SECRET: process.env.GITHUB_WEBHOOK_SECRET || 'axi-deploy-webhook-secret',
        GITHUB_API_URL: 'https://api.github.com',
        
        // CORS 配置
        CORS_ORIGIN: 'https://redamancy.com.cn',
        
        // 日志配置
        LOG_LEVEL: 'info',
        LOG_FILE_PATH: '/var/log/axi-deploy-dashboard',
        
        // 缓存配置
        CACHE_TTL: 300,
        CACHE_MAX_ITEMS: 1000,
        
        // 限流配置
        RATE_LIMIT_WINDOW: 15,
        RATE_LIMIT_MAX_REQUESTS: 100,
        
        // WebSocket 配置
        WS_HEARTBEAT_INTERVAL: 30000,
        WS_MAX_CONNECTIONS: 500,
        
        // 通知配置
        NOTIFICATION_ENABLED: true,
        NOTIFICATION_CHANNELS: 'webhook,email',
        
        // 时区配置
        TZ: 'Asia/Shanghai'
      },
      
      // 日志配置
      log_file: '/var/log/axi-deploy-dashboard/backend-combined.log',
      out_file: '/var/log/axi-deploy-dashboard/backend-out.log',
      error_file: '/var/log/axi-deploy-dashboard/backend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // 进程管理
      restart_delay: 5000,
      max_restarts: 3,
      min_uptime: '30s',
      
      // 监控配置
      monitoring: false,
      
      // 自动重启配置
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      
      // 内存限制
      max_memory_restart: '1G',
      
      // 健康检查
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true
    },
    {
      name: 'dashboard-frontend',
      script: './frontend-server.js',
      cwd: '/srv/apps/axi-project-dashboard',
      instances: 1,
      exec_mode: 'fork',
      
      // 环境变量
      env: {
        NODE_ENV: 'production',
        FRONTEND_PORT: 3000,  // 前端静态文件服务器端口
      },
      
      // 日志配置
      log_file: '/var/log/axi-deploy-dashboard/frontend-combined.log',
      out_file: '/var/log/axi-deploy-dashboard/frontend-out.log',
      error_file: '/var/log/axi-deploy-dashboard/frontend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // 进程管理
      restart_delay: 3000,
      max_restarts: 3,
      min_uptime: '10s',
      
      // 监控配置
      monitoring: false,
      
      // 自动重启配置
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      
      // 内存限制
      max_memory_restart: '512M',
      
      // 健康检查
      health_check_grace_period: 2000,
      health_check_fatal_exceptions: true
    }
  ]
};
