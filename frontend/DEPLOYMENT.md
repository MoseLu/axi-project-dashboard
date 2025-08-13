# 部署配置说明

## 路由配置

本项目已配置为支持生产环境部署到 `https://redamancy.com.cn/project-dashboard/` 路径。

### 开发环境
- 本地访问：`http://localhost:3000/`
- 路由示例：`http://localhost:3000/dashboard`、`http://localhost:3000/logs`

### 生产环境
- 生产访问：`https://redamancy.com.cn/project-dashboard/`
- 路由示例：`https://redamancy.com.cn/project-dashboard/dashboard`、`https://redamancy.com.cn/project-dashboard/logs`

## 配置说明

### Vite 配置
```typescript
// vite.config.ts
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/project-dashboard/' : '/',
  // ... 其他配置
})
```

### Package.json 配置
```json
{
  "homepage": "/project-dashboard/"
}
```

### 环境配置
```typescript
// src/config/env.ts
const envConfig = {
  baseUrl: 'https://redamancy.com.cn', // 生产环境
  apiPrefix: '/project-dashboard/api',
  // ...
};
```

## API 路径

### 开发环境
- API 基础路径：`/project-dashboard/api`
- 示例：`http://localhost:3000/project-dashboard/api/deployments`

### 生产环境
- API 基础路径：`/project-dashboard/api`
- 示例：`https://redamancy.com.cn/project-dashboard/api/deployments`

## 部署步骤

1. **构建项目**
   ```bash
   pnpm build
   ```

2. **部署到服务器**
   - 将 `dist` 目录内容部署到服务器的 `/project-dashboard/` 路径下
   - 确保服务器配置了正确的路由重写规则

3. **Nginx 配置示例**
   ```nginx
   location /project-dashboard/ {
       alias /path/to/your/dist/;
       try_files $uri $uri/ /project-dashboard/index.html;
   }
   
   location /project-dashboard/api/ {
       proxy_pass http://localhost:8090/api/;
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
   }
   ```

## 注意事项

1. **路由兼容性**：所有内部导航都使用相对路径，React Router 会自动处理 base 路径
2. **API 调用**：使用 `buildApiUrl()` 函数构建 API URL，确保环境兼容性
3. **静态资源**：Vite 会自动为静态资源添加正确的 base 路径前缀
4. **刷新页面**：确保服务器配置了 SPA 路由重写，避免 404 错误

## 环境变量

可以通过环境变量进一步自定义配置：

```bash
# .env.production
VITE_API_BASE_URL=https://redamancy.com.cn
VITE_BASE_PATH=/project-dashboard
```

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:3000
VITE_BASE_PATH=/
```
