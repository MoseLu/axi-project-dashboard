# axi-project-dashboard 部署修复指南

## 问题诊断

部署过程中遇到了 `Error: Cannot find module 'depd'` 错误，这是由于以下几个问题导致的：

1. **依赖安装不完整**：服务器上的node_modules可能缺少关键依赖包
2. **TypeScript编译问题**：模块路径别名(@/)在编译后没有正确解析
3. **构建配置错误**：tsconfig.json的输出目录配置与PM2期望的路径不匹配

## 解决方案

### 1. 修复的文件

#### `start.sh` - 新增的启动脚本
- 自动检查和安装依赖
- 处理TypeScript编译
- 验证构建结果
- 启动PM2服务

#### `backend/tsconfig.json` - 修复编译配置
```json
{
  "compilerOptions": {
    "outDir": "./dist",  // 修改为dist目录
    // ... 其他配置
  }
}
```

#### `ecosystem.config.js` - 修复PM2配置
```javascript
{
  script: './backend/dist/index.js',  // 指向正确的编译输出
  // ... 其他配置
}
```

#### `backend/build.js` - 新增构建脚本
- 处理TypeScript编译
- 自动解析模块路径别名(@/ → ./)
- 确保构建产物正确

#### `backend/package.json` - 更新构建脚本
```json
{
  "scripts": {
    "build": "node build.js",  // 使用自定义构建脚本
    "prebuild": "rm -rf dist"  // 构建前清理
  }
}
```

### 2. 部署步骤

在服务器上执行以下命令：

```bash
# 进入项目目录
cd /srv/apps/axi-project-dashboard

# 运行修复后的启动脚本
bash start.sh
```

### 3. 启动脚本功能

`start.sh` 脚本会自动处理：

1. **环境检查**：验证Node.js、npm、PM2是否可用
2. **依赖安装**：
   - 安装生产依赖：`npm install --only=production`
   - 确保关键依赖存在（如depd）
   - 安装构建依赖（typescript等）
3. **项目构建**：
   - 清理旧的构建文件
   - 编译TypeScript代码
   - 解析模块路径别名
   - 验证构建结果
4. **服务启动**：
   - 停止现有PM2进程
   - 启动新的服务实例
   - 显示启动日志

### 4. 验证部署

启动完成后，可以通过以下方式验证：

```bash
# 检查PM2进程状态
pm2 list

# 查看应用日志
pm2 logs dashboard-backend

# 健康检查
curl http://localhost:8090/health

# 检查端口占用
netstat -tlnp | grep 8090
```

### 5. 故障排除

如果仍然遇到问题：

1. **检查依赖**：
   ```bash
   cd /srv/apps/axi-project-dashboard/backend
   npm list depd
   ```

2. **检查构建输出**：
   ```bash
   ls -la /srv/apps/axi-project-dashboard/backend/dist/
   ```

3. **查看详细日志**：
   ```bash
   pm2 logs dashboard-backend --lines 50
   ```

4. **手动测试构建**：
   ```bash
   cd /srv/apps/axi-project-dashboard/backend
   npm run build
   node dist/index.js
   ```

## 关键改进

1. **依赖管理**：确保所有必需的依赖包都被正确安装
2. **路径解析**：修复了TypeScript模块路径别名问题
3. **构建流程**：简化并自动化了构建过程
4. **错误处理**：在启动脚本中增加了详细的错误检查和提示
5. **维护性**：提供了清晰的部署和故障排除流程

这些修复确保了axi-project-dashboard项目能够在生产环境中正确构建和启动。
