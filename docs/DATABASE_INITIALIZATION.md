# axi-project-dashboard 数据库初始化策略

## 概述

axi-project-dashboard 项目采用与 axi-star-cloud 相同的数据库策略：
- **启动时**：只连接数据库，不自动执行初始化
- **初始化时**：表不存在则创建，已存在则跳过，保持数据完整性
- **部署时**：通过部署脚本或手动命令执行数据库初始化

## 初始化策略

### 核心原则
- **非破坏性初始化**：不会删除或重置现有数据
- **增量式创建**：只创建缺失的表和字段
- **数据保护**：保留所有现有数据
- **测试数据清理**：自动识别并清理测试数据

### 初始化流程

1. **数据库连接检查**
   - 验证数据库连接是否正常
   - 测试基本查询功能

2. **表结构检查**
   - 获取现有表列表
   - 识别缺失的必需表
   - 只创建缺失的表

3. **字段完整性检查**
   - 检查必需字段是否存在
   - 自动添加缺失的字段
   - 保持现有数据不变

4. **测试数据清理**
   - 识别包含 'test'、'demo'、'example' 的数据
   - 清理孤立的关联数据
   - 保持真实业务数据

5. **初始数据插入**
   - 仅在需要时创建管理员账户
   - 不覆盖现有用户数据

## 必需的表

项目需要以下表结构：

### users（用户表）
- 用户账户信息
- 角色管理
- 登录记录

### deployments（部署记录表）
- 部署状态跟踪
- 项目信息
- 时间戳记录

### deployment_steps（部署步骤表）
- 部署过程步骤
- 步骤状态跟踪
- 关联部署记录

### projects（项目表）
- 项目配置信息
- 仓库设置
- 环境配置

### user_sessions（用户会话表）
- Token 管理
- 会话过期处理
- 安全控制

## 环境变量配置

### 数据库连接
```bash
export MYSQL_HOST=127.0.0.1
export MYSQL_PORT=3306
export MYSQL_USER=root
export MYSQL_PASSWORD=123456
export MYSQL_DATABASE=project_dashboard
```

### 初始化控制
```bash
export SKIP_DB_INIT=false  # 启用数据库初始化
```

## 启动流程集成

### 数据库连接（非自动初始化）
项目启动时只连接数据库，不自动执行初始化（模仿 axi-star-cloud 策略）：

```typescript
// 在 src/index.ts 中
private async initializeServices(): Promise<void> {
  // 数据库连接（模仿 axi-star-cloud 策略：连接数据库但不自动初始化）
  if (!skipDbInit) {
    logger.info('🔧 连接数据库（模仿 axi-star-cloud 策略：连接数据库但不自动初始化）...');
    // 连接数据库但不执行初始化
    logger.info('💡 数据库连接策略：连接数据库但不自动初始化，初始化在部署时完成');
  }
}
```

### 手动初始化
可以使用以下命令手动执行初始化：

```bash
# 初始化数据库
npm run db:init

# 查看数据库状态
npm run db:status

# 清理测试数据
npm run db:cleanup-test

# 重置部署数据（谨慎使用）
npm run db:reset-deployments
```

## 部署配置

### PM2 配置
在 `ecosystem.config.js` 中：

```javascript
env: {
  SKIP_DB_INIT: 'false', // 启用数据库连接（模仿 axi-star-cloud 策略：连接数据库但不自动初始化）
  MYSQL_HOST: '127.0.0.1',
  MYSQL_PORT: '3306',
  MYSQL_USER: 'root',
  MYSQL_PASSWORD: '123456',
  MYSQL_DATABASE: 'project_dashboard',
}
```

### Shell 脚本配置
在 `start.sh` 和 `start-simple.sh` 中：

```bash
# 数据库配置（模仿 axi-star-cloud 策略）
export MYSQL_HOST=${MYSQL_HOST:-127.0.0.1}
export MYSQL_PORT=${MYSQL_PORT:-3306}
export MYSQL_USER=${MYSQL_USER:-root}
export MYSQL_PASSWORD=${MYSQL_PASSWORD:-123456}
export MYSQL_DATABASE=${MYSQL_DATABASE:-project_dashboard}
export SKIP_DB_INIT=${SKIP_DB_INIT:-false}
```

## 安全考虑

### 数据保护
- 初始化过程不会删除现有数据
- 只进行增量式表结构更新
- 保留所有业务数据

### 测试数据清理
- 自动识别测试数据模式
- 清理孤立的数据记录
- 保持数据一致性

### 权限控制
- 使用数据库用户权限
- 限制数据库操作范围
- 记录所有初始化操作

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查数据库服务状态
   - 验证连接参数
   - 确认网络连通性

2. **权限不足**
   - 检查数据库用户权限
   - 确认 CREATE TABLE 权限
   - 验证 ALTER TABLE 权限

3. **表已存在错误**
   - 这是正常现象，表示表已存在
   - 初始化会跳过已存在的表
   - 继续执行后续步骤

### 日志查看
```bash
# 查看 PM2 日志
pm2 logs dashboard-backend

# 查看应用日志
tail -f /var/log/axi-deploy-dashboard/backend-combined.log
```

## 最佳实践

1. **生产环境部署**
   - 在部署前备份数据库
   - 在测试环境验证初始化流程
   - 监控初始化日志

2. **开发环境**
   - 使用 `SKIP_DB_INIT=true` 跳过初始化
   - 手动执行初始化命令
   - 定期清理测试数据

3. **数据迁移**
   - 使用数据库迁移工具
   - 保持数据版本控制
   - 测试迁移脚本

## 总结

axi-project-dashboard 的数据库策略确保了：
- **启动安全**：启动时只连接数据库，不自动初始化
- **数据安全**：初始化时不破坏现有数据
- **部署稳定**：通过部署脚本控制初始化时机
- **维护简单**：增量式更新，易于管理
- **兼容性好**：与 axi-star-cloud 保持一致的策略
