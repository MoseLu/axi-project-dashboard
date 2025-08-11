# axi-project-dashboard 启动脚本修复

## 🚨 问题描述

在 `axi-project-dashboard` 部署过程中出现目录不存在错误：

```
🚀 执行启动命令...
- 项目: axi-project-dashboard
- 启动命令: bash start.sh
/home/runner/work/_temp/cc2d6d2a-138f-40e6-b041-3f1ee37ccfa5.sh: line 6: cd: /srv/apps/axi-project-dashboard: No such file or directory
Error: Process completed with exit code 1.
```

**问题原因：**
- `axi-project-dashboard` 的部署工作流创建了一个 `start.sh` 脚本
- 该脚本试图在GitHub Actions runner上执行 `cd /srv/apps/axi-project-dashboard`
- 但该目录在runner上不存在，应该在服务器上执行
- 脚本缺少执行环境说明

## 🔧 修复方案

### 1. 添加执行环境说明

在 `start.sh` 脚本开头添加明确的注释，说明脚本将在服务器上执行：

```bash
#!/bin/bash
set -e
echo "🚀 Starting axi-project-dashboard backend..."

# 注意：这个脚本将在服务器上执行，不是在GitHub Actions runner上
# 所以可以直接访问 /srv/apps/axi-project-dashboard 目录
cd /srv/apps/axi-project-dashboard
```

### 2. 部署流程说明

`axi-project-dashboard` 的部署流程：

1. **构建阶段**：在GitHub Actions runner上构建项目
2. **创建启动脚本**：生成 `start.sh` 脚本（将在服务器上执行）
3. **上传构建产物**：将构建产物和启动脚本上传为artifact
4. **触发部署**：通过 `workflow_run` 事件触发 `axi-deploy/main-deployment.yml`
5. **服务器部署**：`axi-deploy` 下载构建产物到服务器
6. **执行启动脚本**：在服务器上执行 `start.sh` 脚本

### 3. 执行环境对比

| 阶段 | 执行环境 | 目录访问 | 说明 |
|------|----------|----------|------|
| 构建 | GitHub Actions runner | `/home/runner/work/...` | 构建项目文件 |
| 启动脚本创建 | GitHub Actions runner | `/home/runner/work/...` | 生成脚本文件 |
| 启动脚本执行 | 服务器 | `/srv/apps/axi-project-dashboard` | 实际启动服务 |

## 📊 修复效果

### 修复前
- 启动脚本在GitHub Actions runner上执行
- 尝试访问不存在的 `/srv/apps/axi-project-dashboard` 目录
- 立即失败，退出码为1

### 修复后
- 启动脚本在服务器上执行
- 正确访问 `/srv/apps/axi-project-dashboard` 目录
- 正常启动服务

## 🔍 验证方法

### 1. 检查脚本内容

在构建产物中查看生成的 `start.sh` 脚本：

```bash
# 在GitHub Actions中查看构建产物
cat dist/start.sh
```

### 2. 检查执行环境

在服务器上验证脚本执行：

```bash
# SSH到服务器
ssh deploy@redamancy.com.cn

# 检查目录是否存在
ls -la /srv/apps/axi-project-dashboard/

# 手动执行启动脚本
cd /srv/apps/axi-project-dashboard
bash start.sh
```

### 3. 检查服务状态

验证服务是否正常启动：

```bash
# 检查PM2进程
pm2 status

# 检查端口占用
netstat -tlnp | grep :8080

# 检查健康状态
curl http://localhost:8080/health
```

## 🚀 部署建议

### 1. 脚本设计原则

- **明确执行环境**：在脚本开头说明执行环境
- **错误处理**：添加适当的错误检查和处理
- **日志输出**：提供详细的执行日志
- **状态验证**：验证服务启动状态

### 2. 测试验证

- **本地测试**：在开发环境中测试脚本
- **服务器测试**：在目标服务器上测试脚本
- **集成测试**：通过完整部署流程测试

### 3. 监控告警

- **部署监控**：监控部署成功率和时间
- **服务监控**：监控服务启动状态
- **错误告警**：设置失败告警机制

## 📝 相关文件

- `axi-project-dashboard_deploy.yml`: 修复后的部署工作流
- `start.sh`: 生成的启动脚本
- `ecosystem.config.js`: PM2配置文件
- `START_SCRIPT_FIX.md`: 本文档

## ✅ 验证清单

- [ ] 启动脚本包含执行环境说明
- [ ] 脚本在服务器上正确执行
- [ ] 目录访问正常
- [ ] 服务启动成功
- [ ] 健康检查通过
- [ ] 部署流程完整

## 🔧 故障排除

### 常见问题

1. **目录不存在**
   - 检查服务器上的目录结构
   - 确认部署路径正确
   - 验证用户权限

2. **权限问题**
   - 检查文件执行权限
   - 确认用户有访问权限
   - 验证PM2权限

3. **依赖问题**
   - 检查Node.js和pnpm安装
   - 验证依赖包完整性
   - 确认构建产物正确

### 调试技巧

1. 查看构建产物内容
2. 检查服务器上的文件结构
3. 手动执行启动脚本
4. 查看PM2日志
5. 检查网络端口状态
