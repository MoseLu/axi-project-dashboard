# 认证系统使用指南

## 概述

axi-project-dashboard 项目已集成完整的用户认证系统，包括登录、注册、退出登录等功能。

## 功能特性

### 🔐 认证功能
- **用户登录**: 支持用户名/邮箱登录
- **用户注册**: 新用户注册功能
- **Token验证**: JWT token自动验证
- **退出登录**: 安全退出并清除会话
- **路由保护**: 自动重定向未认证用户

### 🛡️ 安全特性
- **密码加密**: 使用 bcrypt 加密存储
- **JWT认证**: 基于 JWT 的无状态认证
- **Token过期**: 自动处理 token 过期
- **路由守卫**: 保护需要认证的页面

## 快速开始

### 1. 启动服务

```bash
# 启动后端服务
cd axi-project-dashboard/backend
pnpm run dev

# 启动前端服务
cd axi-project-dashboard/frontend
pnpm run dev
```

### 2. 数据库初始化

首次启动时，系统会自动创建数据库表结构和默认管理员账户：

```bash
# 手动初始化数据库（可选）
cd axi-project-dashboard/backend
pnpm run db:init
```

### 3. 默认登录信息

系统会自动创建默认管理员账户：

- **用户名**: `admin`
- **密码**: `admin123`
- **邮箱**: `admin@axi.com`
- **角色**: `admin`

## 使用说明

### 登录流程

1. 访问应用首页，系统会自动重定向到登录页
2. 输入用户名/邮箱和密码
3. 点击登录按钮
4. 登录成功后自动跳转到原目标页面

### 注册流程

1. 在登录页切换到"注册"标签
2. 填写用户名、邮箱、密码和确认密码
3. 点击注册按钮
4. 注册成功后自动切换到登录页

### 退出登录

1. 点击右上角用户头像
2. 选择"退出登录"
3. 系统会清除本地存储并跳转到登录页

## API 接口

### 认证相关接口

#### 用户登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

#### 用户注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "Password123",
  "confirmPassword": "Password123"
}
```

#### 验证Token
```http
GET /api/auth/verify
Authorization: Bearer <token>
```

#### 获取用户信息
```http
GET /api/auth/me
Authorization: Bearer <token>
```

#### 退出登录
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

## 数据库结构

### 用户表 (users)
```sql
CREATE TABLE users (
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## 前端组件

### 认证上下文 (AuthContext)
```typescript
import { useAuth } from '../contexts/AuthContext';

const { user, isAuthenticated, login, logout } = useAuth();
```

### 受保护路由 (ProtectedRoute)
```typescript
import ProtectedRoute from '../components/auth/ProtectedRoute';

<ProtectedRoute>
  <YourComponent />
</ProtectedRoute>
```

### API 工具
```typescript
import { api } from '../utils/api';

// 自动添加认证头
const data = await api.get('/some-endpoint');

// 不需要认证的请求
const data = await api.post('/auth/login', credentials, { requireAuth: false });
```

## 配置说明

### 环境变量

#### 后端配置
```bash
# JWT 配置
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# 数据库配置
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=123456
MYSQL_DATABASE=project_dashboard

# 跳过数据库初始化（开发环境）
SKIP_DB_INIT=true
```

#### 前端配置
```bash
# API 基础URL
VITE_API_BASE_URL=http://localhost:8090
VITE_API_PREFIX=/project-dashboard/api
```

## 安全建议

### 生产环境配置

1. **修改默认密码**: 首次登录后立即修改默认管理员密码
2. **强密码策略**: 启用强密码要求
3. **HTTPS**: 使用 HTTPS 传输
4. **Token过期**: 设置合理的 token 过期时间
5. **限流**: 启用 API 限流保护

### 密码要求

- 最少 6 个字符
- 包含大小写字母和数字
- 避免常见密码

## 故障排除

### 常见问题

#### 1. 登录失败
- 检查用户名和密码是否正确
- 确认数据库连接正常
- 查看后端日志错误信息

#### 2. Token 验证失败
- 检查 JWT_SECRET 配置
- 确认 token 未过期
- 清除浏览器本地存储重试

#### 3. 数据库连接失败
- 检查数据库服务是否启动
- 确认数据库配置正确
- 运行 `pnpm run db:init` 初始化数据库

#### 4. 前端无法访问后端
- 确认后端服务运行在正确端口
- 检查 CORS 配置
- 验证 API 代理设置

### 调试模式

```bash
# 后端调试模式
cd axi-project-dashboard/backend
DEBUG=* pnpm run dev

# 前端调试模式
cd axi-project-dashboard/frontend
pnpm run dev
```

## 扩展功能

### 计划中的功能

- [ ] GitHub OAuth 登录
- [ ] 邮箱验证
- [ ] 密码重置
- [ ] 多因素认证
- [ ] 用户权限管理
- [ ] 登录日志记录

### 自定义扩展

如需添加新的认证方式或修改现有功能，请参考以下文件：

- 后端认证路由: `backend/src/routes/auth.routes.ts`
- 前端认证上下文: `frontend/src/contexts/AuthContext.tsx`
- 数据库初始化: `backend/src/scripts/init-database.ts`
- API 工具: `frontend/src/utils/api.ts`

## 更新日志

### v1.0.0 (2024-01-XX)
- ✅ 基础用户认证系统
- ✅ JWT token 认证
- ✅ 用户注册和登录
- ✅ 路由保护
- ✅ 数据库自动初始化
- ✅ 默认管理员账户
