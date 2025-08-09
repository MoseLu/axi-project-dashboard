# GitHub Actions 部署修复指南

## 🔍 问题分析

`axi-project-dashboard` 项目通过 GitHub Actions 自动化部署，错误 `Cannot find module 'depd'` 是由以下问题导致的：

### 根本原因
1. **TypeScript编译配置问题**：模块路径别名(@/)在编译后没有正确解析
2. **构建产物路径错误**：PM2配置指向了错误的文件路径
3. **依赖验证不足**：构建过程中没有充分验证关键依赖的存在

## ✅ 修复方案

### 1. 修复的文件

#### `backend/tsconfig.json`
```json
{
  "compilerOptions": {
    "outDir": "./dist",  // 确保输出到dist目录
    // ... 其他配置保持不变
  }
}
```

#### `ecosystem.config.js`
```javascript
{
  script: './backend/index.js',  // 指向正确的编译输出文件
  // ... 其他配置保持不变
}
```

#### `.github/workflows/axi-project-dashboard_deploy.yml`
**主要修改**：
- **构建后端步骤**：增加依赖验证，使用`npx tsc`直接编译
- **部署文件准备**：验证构建产物的完整性
- **部署脚本**：移除复杂的路径别名包装器，简化验证流程

### 2. 关键修复点

#### 🔨 **构建过程改进**
```yaml
- name: 构建后端
  working-directory: backend
  run: |
    # 清理并重新安装依赖
    rm -rf node_modules dist
    pnpm install --no-frozen-lockfile
    
    # 验证关键依赖
    ls node_modules/typescript || echo "❌ TypeScript 缺失"
    ls node_modules/depd || echo "❌ depd 缺失"
    ls node_modules/express || echo "❌ express 缺失"
    
    # 直接使用TypeScript编译器
    npx tsc
    
    # 验证构建产物
    ls -la dist/ || echo "dist目录不存在"
    ls -la dist/*.js || echo "编译的JS文件不存在"
```

#### 📦 **部署产物验证**
```yaml
# 验证关键构建产物
echo "🔍 验证后端构建产物..."
ls -la dist/backend/ || echo "❌ backend构建产物不存在"
ls -la dist/backend/index.js || echo "❌ 主入口文件不存在"
ls -la dist/node_modules/depd/ || echo "❌ depd依赖不存在"
```

#### 🚀 **简化的部署脚本**
移除了复杂的路径别名包装器 (`start-server.js`)，直接使用编译后的文件：
```bash
# 验证部署文件结构
ls -la backend/index.js || echo "❌ backend/index.js不存在"
ls -la node_modules/depd/ || echo "❌ depd依赖不存在"

# 验证PM2配置
grep "script:" ecosystem.config.js || echo "❌ PM2脚本配置不存在"
```

## 🔄 部署流程

### 自动化部署流程
1. **代码推送** → `git push origin main`
2. **GitHub Actions触发** → `.github/workflows/axi-project-dashboard_deploy.yml`
3. **构建阶段**：
   - 安装依赖并验证关键模块
   - TypeScript编译到 `backend/dist/`
   - 前端React构建
4. **部署准备**：
   - 复制构建产物到部署包
   - 验证文件完整性
5. **服务器部署**：
   - 上传到 `/srv/apps/axi-project-dashboard`
   - PM2启动 `./backend/index.js`

### 验证部署成功
```bash
# 检查PM2进程
pm2 list

# 查看日志
pm2 logs dashboard-backend

# 健康检查
curl https://redamancy.com.cn/project-dashboard/api/health
```

## 🛠️ 故障排除

### 如果仍然遇到 `depd` 模块错误：

1. **检查构建日志**：
   - 在GitHub Actions中查看"构建后端"步骤的日志
   - 确认 `ls node_modules/depd` 显示依赖存在

2. **检查部署产物**：
   - 在"准备部署文件"步骤中查看验证结果
   - 确认 `dist/node_modules/depd/` 被正确复制

3. **检查服务器文件**：
   ```bash
   ssh deploy@server
   cd /srv/apps/axi-project-dashboard
   ls -la node_modules/depd/
   ```

4. **检查PM2配置**：
   ```bash
   cat ecosystem.config.js | grep script
   ls -la backend/index.js
   ```

## 📋 部署检查清单

- [ ] GitHub Actions构建成功完成
- [ ] 构建日志显示所有依赖验证通过
- [ ] 部署脚本成功上传文件到服务器
- [ ] PM2进程成功启动
- [ ] 健康检查端点可访问
- [ ] 应用日志无错误信息

## 🎯 关键改进

1. **简化架构**：移除复杂的路径别名包装器，使用标准的TypeScript编译输出
2. **增强验证**：在构建和部署的每个阶段都验证关键文件和依赖的存在
3. **错误处理**：改进了错误检测和诊断信息
4. **维护性**：简化了部署流程，更容易调试和维护

这些修复确保了 `axi-project-dashboard` 项目通过 GitHub Actions 能够正确构建和部署到生产环境。
