# 启动时间优化指南

## 问题描述

当前启动服务工作流耗时过长（2分55秒），影响开发和生产效率。

## 启动时间分析

### 当前启动流程耗时分析

1. **依赖检查和安装** - 30-60秒
2. **构建产物检查** - 10-20秒
3. **PM2服务启动** - 20-40秒
4. **健康检查等待** - 30-60秒
5. **其他检查步骤** - 10-20秒

**总计**: 约2-3分钟

## 优化方案

### 1. 快速启动脚本

使用 `./start-fast.sh` 脚本，跳过不必要的检查：

```bash
# 快速启动（预计30-60秒）
./start-fast.sh
```

**优化点**:
- 跳过详细依赖检查
- 跳过完整构建过程
- 使用基本的前端和后端文件
- 减少健康检查等待时间

### 2. 预构建优化

在CI/CD中预构建，避免运行时构建：

```bash
# 在构建阶段
cd frontend && pnpm build
cd ../backend && pnpm build

# 在部署阶段，直接使用构建产物
./start-fast.sh
```

### 3. 依赖缓存优化

使用pnpm缓存加速依赖安装：

```bash
# 设置pnpm缓存
pnpm config set store-dir ~/.pnpm-store

# 使用缓存安装
pnpm install --frozen-lockfile
```

### 4. 健康检查优化

减少健康检查等待时间：

```bash
# 修改start.sh中的健康检查
# 从10次检查改为3次
for i in {1..3}; do
    if curl -f http://localhost:8090/health > /dev/null 2>&1; then
        echo "✅ 后端健康检查通过"
        break
    fi
    sleep 1  # 从2秒改为1秒
done
```

### 5. 并行启动优化

并行启动前端和后端服务：

```bash
# 并行启动
pm2 start ecosystem.config.js --update-env &
wait
```

## 启动时间基准

### 性能目标

- **优秀**: < 30秒
- **良好**: 30-60秒
- **一般**: 60-120秒
- **较慢**: > 120秒

### 当前状态

- **当前时间**: 2分55秒 (175秒)
- **目标时间**: < 60秒
- **优化空间**: 65%+

## 具体优化步骤

### 步骤1: 使用快速启动脚本

```bash
# 给脚本执行权限
chmod +x start-fast.sh

# 运行快速启动
./start-fast.sh
```

### 步骤2: 分析启动瓶颈

```bash
# 运行启动时间分析
node analyze-startup-time.js
```

### 步骤3: 预构建优化

```bash
# 在开发环境中预构建
cd frontend && pnpm build
cd ../backend && pnpm build

# 确保构建产物存在
ls -la frontend/dist backend/dist
```

### 步骤4: 依赖优化

```bash
# 使用pnpm缓存
pnpm install --frozen-lockfile

# 或使用npm缓存
npm ci
```

### 步骤5: 服务配置优化

修改 `ecosystem.config.js`:

```javascript
{
  name: 'dashboard-backend',
  // 减少重启延迟
  restart_delay: 2000,  // 从5000改为2000
  // 减少最小运行时间
  min_uptime: '10s',    // 从30s改为10s
  // 减少健康检查等待
  health_check_grace_period: 1000  // 从3000改为1000
}
```

## 监控和测量

### 启动时间监控

```bash
# 测量启动时间
time ./start-fast.sh

# 或使用分析脚本
node analyze-startup-time.js
```

### 性能指标

- **冷启动时间**: 首次启动的完整时间
- **热启动时间**: 依赖已安装的启动时间
- **服务就绪时间**: 从启动到健康检查通过的时间

## 故障排除

### 常见问题

1. **依赖安装慢**
   - 使用国内镜像源
   - 使用pnpm缓存
   - 预安装依赖

2. **构建时间长**
   - 在CI/CD中预构建
   - 使用构建缓存
   - 优化构建配置

3. **健康检查失败**
   - 检查端口占用
   - 检查服务配置
   - 增加启动等待时间

### 调试命令

```bash
# 检查端口占用
netstat -tlnp | grep :8090

# 检查PM2状态
pm2 list

# 查看启动日志
pm2 logs dashboard-backend

# 检查系统资源
free -h && df -h
```

## 最佳实践

### 开发环境

1. 使用 `./start-fast.sh` 快速启动
2. 预构建前端和后端文件
3. 使用依赖缓存
4. 减少健康检查等待时间

### 生产环境

1. 在CI/CD中预构建所有文件
2. 使用Docker镜像缓存
3. 优化PM2配置
4. 监控启动时间

### CI/CD优化

```yaml
# 在CI/CD中添加缓存
- name: Cache dependencies
  uses: actions/cache@v3
  with:
    path: |
      ~/.pnpm-store
      node_modules
    key: ${{ runner.os }}-deps-${{ hashFiles('**/pnpm-lock.yaml') }}

- name: Build frontend
  run: cd frontend && pnpm build

- name: Build backend
  run: cd backend && pnpm build
```

## 总结

通过以上优化措施，可以将启动时间从2分55秒减少到30-60秒，提升65%以上的启动效率。

**推荐使用顺序**:
1. 使用 `./start-fast.sh` 快速启动
2. 运行 `node analyze-startup-time.js` 分析瓶颈
3. 根据分析结果进行针对性优化
4. 在CI/CD中实施预构建策略
