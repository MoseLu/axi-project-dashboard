# axi-project-dashboard 正确启动指南

## 问题分析

之前的启动问题根本原因是：

1. **缺少 node_modules** - 没有安装项目依赖
2. **过度依赖 start.sh** - 应该使用项目标准的启动命令
3. **ecosystem.config.js 配置错误** - 应该使用标准的 npm/pnpm 脚本

## 正确的启动方式

### 1. 项目标准启动命令

项目已经定义了标准的启动命令：

```bash
# 安装依赖
pnpm install

# 构建项目
pnpm run build

# 启动后端服务
pnpm start

# 启动前端服务
pnpm run dev:fast
```

### 2. 修改后的 ecosystem.config.js

将 `ecosystem.config.js` 中的启动脚本改为使用标准命令：

```javascript
// 后端服务
{
  name: 'dashboard-backend',
  script: 'pnpm',
  args: 'start',
  cwd: process.env.PM2_CWD || '/srv/apps/axi-project-dashboard',
  // ... 其他配置
}

// 前端服务
{
  name: 'dashboard-frontend',
  script: 'pnpm',
  args: 'run dev:fast',
  cwd: process.env.PM2_CWD || '/srv/apps/axi-project-dashboard',
  // ... 其他配置
}
```

### 3. 简化的启动脚本

创建了 `start-standard.sh` 脚本，专注于：

1. **检查并安装依赖**
2. **构建项目**
3. **使用标准启动命令**

## 启动步骤

### 方法一：使用简化脚本

```bash
bash start-standard.sh
```

### 方法二：手动执行

```bash
# 1. 安装依赖
pnpm install

# 2. 构建项目
pnpm run build

# 3. 启动后端
pm2 start --name dashboard-backend --cwd /srv/apps/axi-project-dashboard pnpm -- start

# 4. 启动前端
pm2 start --name dashboard-frontend --cwd /srv/apps/axi-project-dashboard pnpm -- run dev:fast
```

### 方法三：使用 ecosystem.config.js

```bash
# 1. 安装依赖
pnpm install

# 2. 构建项目
pnpm run build

# 3. 使用 PM2 启动
pm2 start ecosystem.config.js
```

## 关键改进

1. **依赖优先** - 确保 node_modules 存在
2. **标准命令** - 使用项目定义的 npm/pnpm 脚本
3. **简化流程** - 移除复杂的文件检查和创建逻辑
4. **错误处理** - 专注于核心启动流程

## 验证方法

启动成功后，可以通过以下方式验证：

```bash
# 检查 PM2 进程
pm2 list

# 检查端口监听
netstat -tlnp | grep -E ":(8090|3000)"

# 健康检查
curl http://localhost:8090/health
curl http://localhost:3000/health
```

## 总结

正确的启动方式应该：

1. **先安装依赖** - 确保 node_modules 存在
2. **再构建项目** - 使用 pnpm run build
3. **最后启动服务** - 使用项目标准的启动命令

而不是过度依赖复杂的启动脚本和文件检查逻辑。
