module.exports = {
  apps: [
    {
      name: 'axi-project-dashboard-backend',
      script: 'backend/dist/index.js',
      cwd: './backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 8090
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 8090
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      max_memory_restart: '512M',
      node_args: '--max-old-space-size=512',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'axi-project-dashboard-frontend',
      script: 'frontend-server.js',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      max_memory_restart: '256M',
      node_args: '--max-old-space-size=256',
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ],
  
  deploy: {
    production: {
      user: 'root',
      host: 'localhost',
      ref: 'origin/main',
      repo: 'https://github.com/MoseLu/axi-project-dashboard.git',
      path: '/srv/apps/axi-project-dashboard',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
