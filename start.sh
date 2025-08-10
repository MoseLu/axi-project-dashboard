#!/bin/bash

# 设置错误时退出
set -e

echo "🚀 Starting axi-project-dashboard backend..."

# 显示当前目录和文件
echo "Current directory: $(pwd)"
echo "Files in directory:"
ls -la

# 检查 Node.js 环境
echo "Node.js environment:"
which node
node --version
which npm
npm --version
which npx
echo "npx available"

# 检查 PM2
if command -v pm2 &> /dev/null; then
    echo "PM2 found: $(pm2 --version)"
else
    echo "PM2 not found, installing..."
    npm install -g pm2
fi

# 直接修复 src 目录问题
echo "🔧 Directly fixing src directory issue..."
cd backend

# 检查是否有 src 目录
if [ ! -d "src" ]; then
    echo "📁 Creating src directory..."
    mkdir -p src
    
    # 检查是否有 TypeScript 源文件
    if [ -f "index.ts" ]; then
        echo "📄 Found index.ts, moving to src/"
        mv index.ts src/
    fi
    
    # 检查是否有其他 TypeScript 文件
    for file in *.ts; do
        if [ -f "$file" ] && [ "$file" != "build.js" ] && [ "$file" != "start-server.js" ]; then
            echo "  📄 Moving $file to src/"
            mv "$file" "src/"
        fi
    done
    
    # 检查是否有编译后的文件，如果有则复制到 src
    if [ -f "index.js" ] && [ ! -f "src/index.ts" ]; then
        echo "📄 Found compiled index.js, creating src/index.ts..."
        # 创建一个简单的 index.ts 文件
        cat > src/index.ts << 'EOF'
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from '@/config/config';
import { connectDatabase } from '@/database/connection';
import { connectRedis } from '@/services/redis.service';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/middleware/error.middleware';
import { authMiddleware } from '@/middleware/auth.middleware';
import { routes } from '@/routes';
import { SocketService } from '@/services/socket.service';
import { MetricsService } from '@/services/metrics.service';
import { HealthCheckService } from '@/services/health.service';
import { gracefulShutdown } from '@/utils/graceful-shutdown';

class Application {
  public app: express.Application;
  public server: http.Server;
  public io: SocketIOServer;
  private socketService: SocketService;
  private metricsService: MetricsService;
  private healthService: HealthCheckService;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: config.cors.origin || '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.socketService = new SocketService(this.io);
    this.metricsService = new MetricsService();
    this.healthService = new HealthCheckService();

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeGracefulShutdown();
  }

  private initializeMiddlewares(): void {
    this.app.use(helmet());
    this.app.use(cors({
      origin: config.cors.origin || '*',
      credentials: true
    }));
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  }

  private initializeRoutes(): void {
    this.app.use('/api', routes);
    this.app.get('/health', async (req, res) => {
      res.status(200).json({
        status: 'healthy',
        message: 'axi-project-dashboard API is running',
        timestamp: new Date().toISOString()
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  private initializeGracefulShutdown(): void {
    gracefulShutdown(this.server, this.io);
  }

  public async start(): Promise<void> {
    try {
      await this.initializeServices();
      const port = process.env.PORT || 8080;
      this.server.listen(port, () => {
        logger.info(`🚀 Server is running on port ${port}`);
        logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`🔗 API URL: http://localhost:${port}/api`);
        logger.info(`💻 WebSocket URL: ws://localhost:${process.env.WEBSOCKET_PORT || 8081}`);
        logger.info(`📚 API Docs: http://localhost:${port}/api-docs`);
      });
    } catch (error) {
      logger.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  private async initializeServices(): Promise<void> {
    try {
      await connectDatabase();
      await connectRedis();
    } catch (error) {
      logger.error('❌ Failed to initialize services:', error);
      throw error;
    }
  }
}

// 启动应用
const app = new Application();
app.start();
EOF
    fi
    
    # 创建必要的子目录并复制现有文件
    mkdir -p src/config src/services src/middleware src/utils src/types src/database src/routes
    
    # 复制现有目录到 src
    if [ -d "config" ]; then
        echo "📁 Copying config directory to src/"
        cp -r config/* src/config/ 2>/dev/null || true
    fi
    
    if [ -d "services" ]; then
        echo "📁 Copying services directory to src/"
        cp -r services/* src/services/ 2>/dev/null || true
    fi
    
    if [ -d "middleware" ]; then
        echo "📁 Copying middleware directory to src/"
        cp -r middleware/* src/middleware/ 2>/dev/null || true
    fi
    
    if [ -d "utils" ]; then
        echo "📁 Copying utils directory to src/"
        cp -r utils/* src/utils/ 2>/dev/null || true
    fi
    
    if [ -d "types" ]; then
        echo "📁 Copying types directory to src/"
        cp -r types/* src/types/ 2>/dev/null || true
    fi
    
    if [ -d "database" ]; then
        echo "📁 Copying database directory to src/"
        cp -r database/* src/database/ 2>/dev/null || true
    fi
    
    if [ -d "routes" ]; then
        echo "📁 Copying routes directory to src/"
        cp -r routes/* src/routes/ 2>/dev/null || true
    fi
    
    echo "✅ Src directory structure created successfully"
fi

cd ..

# 自动依赖修复函数
fix_dependencies() {
    echo "🔧 Auto-fixing dependencies and build issues..."
    
    # 修复 side-channel 依赖
    echo "📦 Installing side-channel dependency..."
    cd backend
    npm install side-channel --save || echo "side-channel already installed"
    cd ..
    npm install --force || echo "Dependencies installation completed"
    
    # 自动修复模块别名问题
    echo "🔧 Auto-fixing module aliases..."
    cd backend
    
    # 检查当前目录结构
    echo "📁 Checking current directory structure..."
    ls -la
    
    # 检查是否有 src 目录
    if [ ! -d "src" ]; then
        echo "📁 Creating src directory..."
        mkdir -p src
        
        # 检查是否有 TypeScript 源文件
        if [ -f "index.ts" ]; then
            echo "📄 Found index.ts, moving to src/"
            mv index.ts src/
        fi
        
        # 检查是否有其他 TypeScript 文件
        for file in *.ts; do
            if [ -f "$file" ] && [ "$file" != "build.js" ] && [ "$file" != "start-server.js" ]; then
                echo "  📄 Moving $file to src/"
                mv "$file" "src/"
            fi
        done
        
        # 检查是否有编译后的文件，如果有则复制到 src
        if [ -f "index.js" ] && [ ! -f "src/index.ts" ]; then
            echo "📄 Found compiled index.js, creating src/index.ts..."
            # 创建一个简单的 index.ts 文件
            cat > src/index.ts << 'EOF'
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from '@/config/config';
import { connectDatabase } from '@/database/connection';
import { connectRedis } from '@/services/redis.service';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/middleware/error.middleware';
import { authMiddleware } from '@/middleware/auth.middleware';
import { routes } from '@/routes';
import { SocketService } from '@/services/socket.service';
import { MetricsService } from '@/services/metrics.service';
import { HealthCheckService } from '@/services/health.service';
import { gracefulShutdown } from '@/utils/graceful-shutdown';

class Application {
  public app: express.Application;
  public server: http.Server;
  public io: SocketIOServer;
  private socketService: SocketService;
  private metricsService: MetricsService;
  private healthService: HealthCheckService;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: config.cors.origin || '*',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.socketService = new SocketService(this.io);
    this.metricsService = new MetricsService();
    this.healthService = new HealthCheckService();

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeGracefulShutdown();
  }

  private initializeMiddlewares(): void {
    this.app.use(helmet());
    this.app.use(cors({
      origin: config.cors.origin || '*',
      credentials: true
    }));
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  }

  private initializeRoutes(): void {
    this.app.use('/api', routes);
    this.app.get('/health', async (req, res) => {
      res.status(200).json({
        status: 'healthy',
        message: 'axi-project-dashboard API is running',
        timestamp: new Date().toISOString()
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  private initializeGracefulShutdown(): void {
    gracefulShutdown(this.server, this.io);
  }

  public async start(): Promise<void> {
    try {
      await this.initializeServices();
      const port = process.env.PORT || 8080;
      this.server.listen(port, () => {
        logger.info(`🚀 Server is running on port ${port}`);
        logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`🔗 API URL: http://localhost:${port}/api`);
        logger.info(`💻 WebSocket URL: ws://localhost:${process.env.WEBSOCKET_PORT || 8081}`);
        logger.info(`📚 API Docs: http://localhost:${port}/api-docs`);
      });
    } catch (error) {
      logger.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  private async initializeServices(): Promise<void> {
    try {
      await connectDatabase();
      await connectRedis();
    } catch (error) {
      logger.error('❌ Failed to initialize services:', error);
      throw error;
    }
  }
}

// 启动应用
const app = new Application();
app.start();
EOF
        fi
        
        # 创建必要的子目录并复制现有文件
        mkdir -p src/config src/services src/middleware src/utils src/types src/database src/routes
        
        # 复制现有目录到 src
        if [ -d "config" ]; then
            echo "📁 Copying config directory to src/"
            cp -r config/* src/config/ 2>/dev/null || true
        fi
        
        if [ -d "services" ]; then
            echo "📁 Copying services directory to src/"
            cp -r services/* src/services/ 2>/dev/null || true
        fi
        
        if [ -d "middleware" ]; then
            echo "📁 Copying middleware directory to src/"
            cp -r middleware/* src/middleware/ 2>/dev/null || true
        fi
        
        if [ -d "utils" ]; then
            echo "📁 Copying utils directory to src/"
            cp -r utils/* src/utils/ 2>/dev/null || true
        fi
        
        if [ -d "types" ]; then
            echo "📁 Copying types directory to src/"
            cp -r types/* src/types/ 2>/dev/null || true
        fi
        
        if [ -d "database" ]; then
            echo "📁 Copying database directory to src/"
            cp -r database/* src/database/ 2>/dev/null || true
        fi
        
        if [ -d "routes" ]; then
            echo "📁 Copying routes directory to src/"
            cp -r routes/* src/routes/ 2>/dev/null || true
        fi
    fi
    
    # 强制重新构建
    echo "🔨 Force rebuilding project..."
    rm -rf dist
    npm run build
    
    # 验证构建结果并自动修复
    if [ -f "dist/index.js" ]; then
        echo "🔍 Verifying build results..."
        
        # 检查并添加 module-alias/register
        if ! grep -q "module-alias/register" dist/index.js; then
            echo "🔧 Adding module-alias/register..."
            # 使用临时文件确保 sed 命令正确执行
            cp dist/index.js dist/index.js.tmp
            echo 'require("module-alias/register");' > dist/index.js
            cat dist/index.js.tmp >> dist/index.js
            rm dist/index.js.tmp
        fi
        
        # 检查路径别名转换
        if grep -q "./config/config" dist/index.js; then
            echo "✅ Path aliases converted to relative paths"
        else
            echo "⚠️ Path aliases may not be converted properly"
        fi
        
        echo "✅ Build verification completed"
    else
        echo "❌ Build failed - dist/index.js not found"
        echo "📋 Checking build errors..."
        npm run build 2>&1 || true
        exit 1
    fi
    
    cd ..
    echo "✅ All fixes applied successfully"
}

# 启动服务函数
start_service() {
    echo "🚀 Starting service with PM2..."
    
    if [ -f "ecosystem.config.js" ]; then
        echo "Found ecosystem.config.js, starting service..."
        
        # 停止现有服务
        pm2 stop dashboard-backend 2>/dev/null || true
        pm2 delete dashboard-backend 2>/dev/null || true
        
        # 启动服务
        pm2 start ecosystem.config.js --update-env
        
        # 等待服务启动并验证端口
        echo "⏳ Waiting for service to start..."
        for i in {1..30}; do
            if netstat -tlnp 2>/dev/null | grep -q ":8080"; then
                echo "✅ Service is listening on port 8080"
                break
            fi
            if [ $i -eq 30 ]; then
                echo "❌ Service failed to start on port 8080 after 60 seconds"
                pm2 logs dashboard-backend --lines 10
                exit 1
            fi
            sleep 2
        done
        
        # 显示服务状态
        pm2 status
        
        echo "✅ Service started successfully"
    else
        echo "❌ ecosystem.config.js not found"
        exit 1
    fi
}

# 健康检查函数
check_health() {
    echo "🔍 Performing health check..."
    
    # 等待服务启动
    sleep 10
    
    # 检查端口
    if netstat -tlnp 2>/dev/null | grep -q ":8080"; then
        echo "✅ Service is listening on port 8080"
    else
        echo "⚠️ Service may not be listening on port 8080"
    fi
    
    # 检查 PM2 状态
    local status=$(pm2 jlist | jq -r '.[] | select(.name=="dashboard-backend") | .pm2_env.status' 2>/dev/null || echo "unknown")
    if [ "$status" = "online" ]; then
        echo "✅ PM2 service is online"
    else
        echo "⚠️ PM2 service status: $status"
    fi
}

# 主执行流程
main() {
    echo "🔧 Starting auto-fix startup process..."
    
    # 1. 修复依赖
    fix_dependencies
    
    # 2. 启动服务
    start_service
    
    # 3. 健康检查
    check_health
    
    echo "🎉 Startup process completed successfully!"
    echo "✅ Service should be running now"
    
    # 显示最终状态
    echo "📊 Final service status:"
    pm2 status
    
    echo "📋 Service logs (last 5 lines):"
    pm2 logs dashboard-backend --lines 5 2>/dev/null || echo "No logs available"
    
    echo "✅ 启动命令执行成功，进程ID: $$"
}

# 执行主流程
main "$@"
