# 部署修复总结

## 问题概述

在部署 `axi-project-dashboard` 项目时，后端服务启动失败，出现模块找不到的错误：

```
Error: Cannot find module '@/config/config'
```

## 根本原因

TypeScript 编译后的 JavaScript 代码中仍然包含路径别名 `@`，但 Node.js 运行时无法解析这些别名，导致模块加载失败。

## 修复方案

### 1. 修复构建脚本 (`backend/build.js`)

在构建过程中自动添加 `module-alias/register` 的引用：

```javascript
// 添加 module-alias 注册到 index.js
if (fs.existsSync('dist/index.js')) {
  const indexContent = fs.readFileSync('dist/index.js', 'utf8');
  if (!indexContent.includes('module-alias/register')) {
    const updatedContent = `"use strict";
require("module-alias/register");
${indexContent}`;
    fs.writeFileSync('dist/index.js', updatedContent);
    console.log('✅ Added module-alias registration to index.js');
  }
}
```

### 2. 创建自动修复脚本 (`scripts/fix-module-alias.js`)

提供一键修复功能，自动处理模块别名问题。

### 3. 更新启动脚本 (`start.sh`)

在启动前自动运行模块别名修复。

## 修复效果

修复前：
```javascript
// 编译后的代码包含 @ 别名，无法运行
const config = require('@/config/config');
```

修复后：
```javascript
"use strict";
require("module-alias/register");
// 编译后的代码使用相对路径，可以正常运行
const config = require('./config/config');
```

## 部署步骤

### 方法一：使用修复脚本（推荐）

```bash
# 1. 进入项目目录
cd axi-project-dashboard

# 2. 运行修复脚本
node scripts/fix-module-alias.js

# 3. 启动服务
bash start.sh
```

### 方法二：手动修复

```bash
# 1. 进入后端目录
cd backend

# 2. 清理并重新构建
rm -rf dist
npm run build

# 3. 启动服务
npm start
```

## 验证修复

修复成功后，应该看到：

1. ✅ 构建过程显示 "Added module-alias registration to index.js"
2. ✅ 服务启动时不再出现模块找不到的错误
3. ✅ 服务器正常监听端口（8080）
4. ✅ 数据库连接成功
5. ✅ API 服务正常运行

## 文件变更清单

- ✅ `backend/build.js` - 添加模块别名注册
- ✅ `scripts/fix-module-alias.js` - 新增自动修复脚本
- ✅ `start.sh` - 更新启动流程
- ✅ `MODULE_ALIAS_FIX.md` - 详细修复指南
- ✅ `DEPLOYMENT_FIX_SUMMARY.md` - 修复总结

## 注意事项

1. **依赖要求**：确保安装了 `module-alias` 和 `tsc-alias`
2. **构建顺序**：先运行修复脚本，再启动服务
3. **PM2 重启**：如果使用 PM2，需要重启服务以加载新的构建文件
4. **日志检查**：启动后检查日志确认没有模块错误

## 故障排除

如果仍然出现问题：

1. 检查 `dist/index.js` 文件是否包含 `module-alias/register`
2. 确认所有路径别名都已转换为相对路径
3. 验证 `package.json` 中的 `_moduleAliases` 配置
4. 检查 TypeScript 编译输出

## 总结

通过以上修复，模块别名问题已完全解决。现在项目可以正常部署和运行，不再出现 `Cannot find module '@/config/config'` 错误。

修复后的项目具有以下特点：
- ✅ 自动处理 TypeScript 路径别名
- ✅ 兼容 Node.js 运行时环境
- ✅ 支持 PM2 进程管理
- ✅ 提供一键修复功能
- ✅ 完整的错误处理和日志记录
