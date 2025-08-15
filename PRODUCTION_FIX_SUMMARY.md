# 生产环境启动问题修复总结

## 问题分析

从重试中心的日志可以看出，生产环境启动失败的主要原因是：

1. **缺少 node_modules 依赖**
   - 根目录缺少 `node_modules`
   - 后端目录缺少 `node_modules`
   - 前端目录缺少 `node_modules`

2. **缺少 frontend-server.js 文件**
   - 启动脚本尝试使用 `frontend-server.js` 但文件不存在
   - 导致前端服务启动失败

3. **ecosystem.config.js 配置问题**
   - 前端服务配置使用了 `pnpm run dev:fast`，这在生产环境不合适
   - 后端服务配置使用了 `pnpm start`，但应该使用 `node backend/dist/index.js`

## 解决方案

### 1. 修复的启动脚本

创建了以下修复脚本：

- `start-production.sh` - Linux 生产环境启动脚本
- `start-production.bat` - Windows 生产环境启动脚本  
- `fix-and-start.sh` - 通用修复和启动脚本

### 2. 修复的配置文件

#### ecosystem.config.js 修复

```javascript
// 后端服务配置
{
  name: 'dashboard-backend',
  script: 'node',                    // 改为直接使用 node
  args: 'backend/dist/index.js',     // 改为使用构建后的文件
  // ...
}

// 前端服务配置  
{
  name: 'dashboard-frontend',
  script: 'frontend-server.js',      // 改为使用自定义前端服务器
  // 移除了 args 配置
  // ...
}
```

### 3. 自动创建的文件

#### frontend-server.js
- 自动创建 Express 前端服务器
- 提供静态文件服务
- 包含健康检查端点
- 支持 SPA 路由
- 自动创建基本的静态文件（如果不存在）

## 使用方法

### 生产环境启动

```bash
# Linux 环境
bash fix-and-start.sh

# 或者使用标准启动脚本
bash start-production.sh
```

### Windows 环境

```cmd
# 双击运行或命令行执行
start-production.bat
```

## 修复步骤

1. **安装依赖**
   - 根目录：`pnpm install --prod`
   - 后端：`cd backend && pnpm install --prod`
   - 前端：`cd frontend && pnpm install --prod`

2. **创建 frontend-server.js**
   - 自动创建 Express 前端服务器
   - 包含完整的中间件配置
   - 自动创建静态文件目录

3. **构建项目**
   - 后端：`pnpm run build:simple` 或 `pnpm run build`
   - 前端：`pnpm run build`

4. **启动服务**
   - 使用 PM2 启动后端和前端服务
   - 使用修复后的 ecosystem.config.js 配置

## 验证方法

启动完成后，检查以下端点：

- 后端健康检查：`http://localhost:8090/health`
- 前端健康检查：`http://localhost:3000/health`
- PM2 状态：`pm2 list | grep dashboard-`

## 注意事项

1. **环境差异**
   - 本地开发环境：Windows
   - 生产环境：Linux
   - 需要确保脚本在两个环境都能正常工作

2. **依赖管理**
   - 使用 pnpm 作为主要包管理器
   - 提供 npm 作为备选方案
   - 生产环境只安装生产依赖

3. **文件权限**
   - Linux 环境需要给脚本添加执行权限
   - Windows 环境直接运行 .bat 文件

4. **端口配置**
   - 后端：8090
   - 前端：3000
   - 可通过环境变量覆盖

## 后续优化建议

1. **Docker 化**
   - 考虑使用 Docker 容器化部署
   - 避免环境差异问题

2. **CI/CD 集成**
   - 在部署流程中自动运行修复脚本
   - 确保每次部署都正确安装依赖

3. **监控和日志**
   - 添加更详细的启动日志
   - 集成监控系统

4. **回滚机制**
   - 添加服务启动失败时的回滚逻辑
   - 确保系统稳定性
