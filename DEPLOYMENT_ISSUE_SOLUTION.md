# 部署问题解决方案

## 问题描述

部署过程中"部署项目"步骤失败，导致整个部署流程中断。

## 错误分析

### 部署流程步骤

1. **解析密钥** - success
2. **服务器初始化** - success  
3. **验证构建产物** - success
4. **部署项目** - **failure** ❌
5. **配置Nginx** - skipped
6. **启动服务** - skipped
7. **测试网站** - skipped

### 可能的原因

1. **构建产物不完整**
2. **文件权限问题**
3. **依赖缺失**
4. **配置错误**
5. **网络连接问题**

## 解决方案

### 1. 立即检查构建产物

运行部署问题诊断脚本：

```bash
# 在本地运行诊断
node debug-deployment-issue.js
```

### 2. 检查GitHub Actions日志

查看具体的错误信息：

```bash
# 查看最近的workflow运行
gh run list --limit 5

# 查看具体运行的日志
gh run view <RUN_ID> --log
```

### 3. 验证构建产物完整性

确保以下文件存在：

```bash
# 检查关键文件
ls -la dist/
ls -la dist/package.json
ls -la dist/ecosystem.config.js
ls -la dist/start.sh
ls -la dist/backend/index.js
ls -la dist/frontend/index.html
```

### 4. 重新构建和部署

如果构建产物有问题，重新触发构建：

```bash
# 手动触发构建工作流
gh workflow run "Build & Deploy AXI Project Dashboard"
```

### 5. 检查部署配置

验证部署配置是否正确：

```javascript
// 检查ecosystem.config.js
{
  name: 'dashboard-backend',
  script: 'backend/start-simple.js',
  cwd: '/srv/apps/axi-project-dashboard',
  // ... 其他配置
}
```

## 常见问题及解决方案

### 问题1: 构建产物不完整

**症状**: 部署验证失败，关键文件缺失

**解决方案**:
```bash
# 清理并重新构建
rm -rf dist/
pnpm install
cd backend && pnpm build
cd ../frontend && pnpm build
```

### 问题2: 文件权限问题

**症状**: 部署后文件无法执行

**解决方案**:
```bash
# 设置正确的文件权限
chmod +x dist/start.sh
chmod +x dist/start-fast.sh
chmod -R 755 dist/
```

### 问题3: 依赖缺失

**症状**: 运行时找不到模块

**解决方案**:
```bash
# 重新安装依赖
cd dist/
pnpm install --prod
```

### 问题4: 配置错误

**症状**: 服务启动失败

**解决方案**:
```bash
# 检查配置文件
cat dist/ecosystem.config.js
cat dist/package.json
```

### 问题5: 网络连接问题

**症状**: 无法连接到服务器

**解决方案**:
```bash
# 检查SSH连接
ssh -i ~/.ssh/id_rsa -p 22 user@server
```

## 调试步骤

### 步骤1: 运行诊断脚本

```bash
node debug-deployment-issue.js
```

### 步骤2: 检查构建产物

```bash
# 检查dist目录
ls -la dist/
du -sh dist/

# 检查关键文件
find dist/ -name "*.js" -o -name "*.json" -o -name "*.sh"
```

### 步骤3: 验证部署配置

```bash
# 检查配置文件
cat dist/ecosystem.config.js | head -20
cat dist/package.json | grep -E "(name|version|scripts)"
```

### 步骤4: 检查GitHub Actions

```bash
# 查看workflow状态
gh run list --limit 10

# 查看具体错误
gh run view <RUN_ID> --log | grep -A 10 -B 10 "error\|Error\|ERROR"
```

### 步骤5: 手动测试部署

```bash
# 在服务器上手动测试
cd /srv/apps/axi-project-dashboard
ls -la
pm2 start ecosystem.config.js
```

## 预防措施

### 1. 构建前检查

```bash
# 检查项目结构
ls -la
ls -la backend/
ls -la frontend/

# 检查依赖
pnpm list
```

### 2. 构建后验证

```bash
# 验证构建产物
ls -la dist/
find dist/ -type f | wc -l
du -sh dist/
```

### 3. 部署前测试

```bash
# 本地测试启动
cd dist/
pm2 start ecosystem.config.js
pm2 status
pm2 logs
```

### 4. 监控部署状态

```bash
# 监控部署进度
gh run watch <RUN_ID>
```

## 快速修复

### 如果构建产物有问题

```bash
# 1. 清理构建产物
rm -rf dist/

# 2. 重新构建
pnpm install
cd backend && pnpm build
cd ../frontend && pnpm build

# 3. 验证构建产物
ls -la dist/
node debug-deployment-issue.js

# 4. 重新触发部署
gh workflow run "Build & Deploy AXI Project Dashboard"
```

### 如果部署配置有问题

```bash
# 1. 检查配置文件
cat ecosystem.config.js
cat package.json

# 2. 修复配置
# 根据错误信息修改相应配置

# 3. 提交修复
git add .
git commit -m "修复部署配置"
git push origin main
```

### 如果服务器连接有问题

```bash
# 1. 检查SSH密钥
ls -la ~/.ssh/
ssh-add -l

# 2. 测试连接
ssh -i ~/.ssh/id_rsa -p 22 user@server

# 3. 检查服务器状态
ssh user@server "pm2 status"
```

## 联系支持

如果问题持续存在，请提供以下信息：

1. **GitHub Actions日志**: `gh run view <RUN_ID> --log`
2. **构建产物检查**: `node debug-deployment-issue.js`
3. **服务器状态**: `pm2 status && systemctl status nginx`
4. **错误截图**: 部署失败的具体错误信息

## 总结

部署失败通常由以下原因引起：
- 构建产物不完整
- 文件权限问题
- 依赖缺失
- 配置错误
- 网络连接问题

通过运行诊断脚本和检查GitHub Actions日志，可以快速定位问题并解决。
