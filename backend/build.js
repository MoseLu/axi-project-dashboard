const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 复制目录的辅助函数
function copyDirectory(source, destination) {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }
  
  const files = fs.readdirSync(source);
  files.forEach(file => {
    const sourcePath = path.join(source, file);
    const destPath = path.join(destination, file);
    
    if (fs.statSync(sourcePath).isDirectory()) {
      copyDirectory(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  });
}

console.log('🔨 Building backend...');

try {
  // 强制重新构建，确保使用最新的修复
  console.log('🔄 Force rebuilding to ensure latest fixes are applied...');

  // 清理 dist 目录
  if (fs.existsSync('dist')) {
    try {
      fs.rmSync('dist', { recursive: true, force: true });
      console.log('✅ Cleaned dist directory');
    } catch (error) {
      // 如果 fs.rmSync 不可用，使用 rimraf
      try {
        execSync('npx rimraf dist', { stdio: 'inherit' });
        console.log('✅ Cleaned dist directory using rimraf');
      } catch (rimrafError) {
        console.log('⚠️ Failed to clean dist directory, continuing...');
      }
    }
  }

  // 检查是否有 src 目录
  if (!fs.existsSync('src')) {
    console.log('❌ No src directory found!');
    console.log('📁 Current directory contents:');
    
    // 获取当前目录文件列表
    let files = [];
    try {
      files = fs.readdirSync('.');
      files.forEach(file => {
        const stat = fs.statSync(file);
        console.log(`  ${stat.isDirectory() ? '📁' : '📄'} ${file}`);
      });
    } catch (error) {
      console.log('⚠️ Could not list directory contents:', error.message);
    }
    
    // 检查是否已经有编译后的文件
    if (fs.existsSync('index.js') && fs.existsSync('index.d.ts')) {
      console.log('✅ Found compiled files, skipping src directory creation');
      console.log('📋 This appears to be a pre-compiled project');
      
      // 但是仍然需要创建 dist 目录并复制文件
      console.log('📁 Creating dist directory for pre-compiled files...');
      if (!fs.existsSync('dist')) {
        fs.mkdirSync('dist', { recursive: true });
      }
      
      // 复制所有编译后的文件到 dist 目录
      const filesToCopy = [
        'index.js', 'index.d.ts', 'index.js.map', 'index.d.ts.map',
        'config', 'database', 'middleware', 'routes', 'scripts', 'services', 'types', 'utils'
      ];
      
      filesToCopy.forEach(item => {
        if (fs.existsSync(item)) {
          const targetPath = path.join('dist', item);
          if (fs.statSync(item).isDirectory()) {
            // 复制目录
            if (!fs.existsSync(targetPath)) {
              fs.mkdirSync(targetPath, { recursive: true });
            }
            copyDirectory(item, targetPath);
          } else {
            // 复制文件
            fs.copyFileSync(item, targetPath);
          }
          console.log(`  📄 Copied ${item} to dist/`);
        }
      });
      
      // 复制 package.json 到 dist
      if (fs.existsSync('package.json')) {
        fs.copyFileSync('package.json', 'dist/package.json');
        console.log('  📄 Copied package.json to dist/');
      }
      
      console.log('✅ Pre-compiled files copied to dist directory');
      return;
    }
    
    // 自动创建 src 目录
    console.log('🔧 Auto-creating src directory...');
    fs.mkdirSync('src', { recursive: true });
    
    // 检查是否有 TypeScript 源文件
    if (fs.existsSync('index.ts')) {
      console.log('📄 Found index.ts, moving to src/');
      fs.renameSync('index.ts', 'src/index.ts');
    }
    
    // 检查是否有其他 TypeScript 文件
    const tsFiles = files.filter(file => file.endsWith('.ts') && file !== 'build.js' && file !== 'start-server.js');
    tsFiles.forEach(file => {
      console.log(`  📄 Moving ${file} to src/`);
      fs.renameSync(file, `src/${file}`);
    });
    
    // 创建必要的子目录并复制文件
    const subdirs = ['config', 'services', 'middleware', 'utils', 'types', 'database', 'routes'];
    subdirs.forEach(dir => {
      const srcDir = `src/${dir}`;
      if (!fs.existsSync(srcDir)) {
        fs.mkdirSync(srcDir, { recursive: true });
      }
      
      // 复制现有目录到 src
      if (fs.existsSync(dir)) {
        console.log(`📁 Copying ${dir} directory to src/`);
        try {
          const files = fs.readdirSync(dir);
          files.forEach(file => {
            const sourcePath = path.join(dir, file);
            const targetPath = path.join(srcDir, file);
            if (fs.statSync(sourcePath).isFile()) {
              // 只复制 TypeScript 源文件，跳过编译后的文件
              if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
                fs.copyFileSync(sourcePath, targetPath);
                console.log(`  📄 Copied ${file} to src/${dir}/`);
              } else if (!file.endsWith('.js') && !file.endsWith('.d.ts') && !file.endsWith('.map')) {
                // 复制其他非编译文件
                fs.copyFileSync(sourcePath, targetPath);
                console.log(`  📄 Copied ${file} to src/${dir}/`);
              }
            }
          });
        } catch (error) {
          console.log(`⚠️ Could not copy ${dir} directory:`, error.message);
        }
      } else {
        console.log(`⚠️ Directory ${dir} not found, creating empty directory`);
      }
    });
    
    // 检查是否有编译后的文件，如果有则创建基础的 src/index.ts
    if (fs.existsSync('index.js') && !fs.existsSync('src/index.ts')) {
      console.log('📄 Found compiled index.js, creating src/index.ts...');
      const indexTsContent = `import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config/config';
import { connectDatabase } from './database/connection';
import { connectRedis } from './services/redis.service';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/error.middleware';
import { authMiddleware } from './middleware/auth.middleware';
import { routes } from './routes';
import { SocketService } from './services/socket.service';
import { MetricsService } from './services/metrics.service';
import { HealthCheckService } from './services/health.service';
import { GracefulShutdown } from './utils/graceful-shutdown';

class Application {
  public app: express.Application;
  public server: http.Server;
  public io: SocketIOServer;
  private socketService: SocketService;
  private metricsService: MetricsService;
  private healthService: HealthCheckService;
  private gracefulShutdown: GracefulShutdown;

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
    this.gracefulShutdown = new GracefulShutdown();

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
    this.gracefulShutdown.setup(this.server, this.io);
  }

  public async start(): Promise<void> {
    try {
      await this.initializeServices();
      const port = process.env.PORT || 8080;
      this.server.listen(port, () => {
        logger.info(\`🚀 Server is running on port \${port}\`);
        logger.info(\`📊 Environment: \${process.env.NODE_ENV || 'development'}\`);
        logger.info(\`🔗 API URL: http://localhost:\${port}/api\`);
        logger.info(\`💻 WebSocket URL: ws://localhost:\${process.env.WEBSOCKET_PORT || 8091}\`);
        logger.info(\`📚 API Docs: http://localhost:\${port}/api-docs\`);
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
app.start();`;
      
      fs.writeFileSync('src/index.ts', indexTsContent);
    }
    
    console.log('✅ Src directory structure created successfully');
  }

  console.log('📁 Found src directory, checking contents...');
  try {
    const srcFiles = fs.readdirSync('src');
    console.log('📄 Source files:', srcFiles.join(', '));
  } catch (error) {
    console.log('⚠️ Could not list src directory contents:', error.message);
  }

  // 编译 TypeScript
  execSync('npx tsc', { stdio: 'inherit' });
  console.log('✅ TypeScript compilation completed');

  // 处理路径别名
  try {
    execSync('npx tsc-alias', { stdio: 'inherit' });
    console.log('✅ Path aliases processed');
  } catch (error) {
    console.log('⚠️ Failed to process path aliases, continuing...');
  }

  // 添加 module-alias 注册到 index.js
  if (fs.existsSync('dist/index.js')) {
    const indexContent = fs.readFileSync('dist/index.js', 'utf8');
    if (!indexContent.includes('module-alias/register')) {
      const updatedContent = `"use strict";
require("module-alias/register");
${indexContent}`;
      fs.writeFileSync('dist/index.js', updatedContent);
      console.log('✅ Added module-alias registration to index.js');
    }
  }

  // 复制必要的文件并更新模块别名配置
  if (fs.existsSync('package.json')) {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // 更新 _moduleAliases 配置，使用相对路径
    packageJson._moduleAliases = {
      "@": ".",
      "@config": "./config",
      "@services": "./services",
      "@middleware": "./middleware",
      "@utils": "./utils",
      "@types": "./types",
      "@database": "./database",
      "@routes": "./routes"
    };
    
    fs.writeFileSync('dist/package.json', JSON.stringify(packageJson, null, 2));
    console.log('✅ Copied package.json with updated module aliases');
  }

  // 验证构建结果
  console.log('🔍 Verifying build results...');
  const requiredFiles = [
    'dist/index.js',
    'dist/config/config.js',
    'dist/services/redis.service.js',
    'dist/utils/logger.js',
    'dist/middleware/error.middleware.js',
    'dist/routes/index.js',
    'dist/services/socket.service.js',
    'dist/services/metrics.service.js',
    'dist/services/health.service.js',
    'dist/utils/graceful-shutdown.js',
    'dist/database/connection.js'
  ];

  const missingFiles = [];
  requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      missingFiles.push(file);
    }
  });

  if (missingFiles.length > 0) {
    console.log('❌ Missing required files:', missingFiles);
    console.log('🔧 Attempting to fix missing files...');
    
    // 检查是否有源文件存在
    const sourceFiles = [
      'src/index.ts',
      'src/config/config.ts',
      'src/services/redis.service.ts',
      'src/utils/logger.ts',
      'src/middleware/error.middleware.ts',
      'src/routes/index.ts',
      'src/services/socket.service.ts',
      'src/services/metrics.service.ts',
      'src/services/health.service.ts',
      'src/utils/graceful-shutdown.ts',
      'src/database/connection.ts'
    ];
    
    const missingSourceFiles = [];
    sourceFiles.forEach(file => {
      if (!fs.existsSync(file)) {
        missingSourceFiles.push(file);
      }
    });
    
    if (missingSourceFiles.length > 0) {
      console.log('❌ Missing source files:', missingSourceFiles);
      throw new Error(`Build verification failed: Missing ${missingFiles.length} build files and ${missingSourceFiles.length} source files`);
    } else {
      console.log('✅ All source files are present, but build files are missing');
      console.log('🔄 Re-running TypeScript compilation...');
      
      // 重新运行 TypeScript 编译
      try {
        execSync('npx tsc', { stdio: 'inherit' });
        console.log('✅ TypeScript recompilation completed');
        
        // 重新验证
        const stillMissingFiles = [];
        requiredFiles.forEach(file => {
          if (!fs.existsSync(file)) {
            stillMissingFiles.push(file);
          }
        });
        
        if (stillMissingFiles.length > 0) {
          console.log('❌ Still missing files after recompilation:', stillMissingFiles);
          throw new Error(`Build verification failed: Missing ${stillMissingFiles.length} files after recompilation`);
        } else {
          console.log('✅ All required files are now present');
        }
      } catch (error) {
        console.log('❌ TypeScript recompilation failed:', error.message);
        throw new Error(`Build verification failed: ${error.message}`);
      }
    }
  } else {
    console.log('✅ All required files are present');
  }

  console.log('🎉 Backend build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
