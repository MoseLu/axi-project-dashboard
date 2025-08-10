# 模块别名问题修复指南

## 问题描述

在部署 `axi-project-dashboard` 项目时，后端服务启动失败，出现以下错误：

```
Error: Cannot find module '@/config/config'
```

这是因为 TypeScript 编译后的 JavaScript 代码中仍然包含路径别名 `@`，但 Node.js 运行时无法解析这些别名。

## 问题原因

1. **TypeScript 路径别名**：项目使用了 `@` 作为路径别名，指向 `src` 目录
2. **编译后路径未转换**：TypeScript 编译时没有正确将别名转换为相对路径
3. **运行时解析失败**：Node.js 无法识别 `@` 别名，导致模块找不到

## 解决方案

### 1. 修复构建脚本

更新 `backend/build.js` 文件，在编译后添加 `module-alias/register` 的引用：

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

### 2. 确保依赖安装

确保 `package.json` 中包含必要的依赖：

```json
{
  "dependencies": {
    "module-alias": "^2.2.3"
  },
  "devDependencies": {
    "tsc-alias": "^1.8.8",
    "tsconfig-paths": "^4.2.0"
  },
  "_moduleAliases": {
    "@": "./dist",
    "@config": "./dist/config",
    "@services": "./dist/services",
    "@middleware": "./dist/middleware",
    "@utils": "./dist/utils",
    "@types": "./dist/types",
    "@database": "./dist/database",
    "@routes": "./dist/routes"
  }
}
```

### 3. 配置 TypeScript

确保 `tsconfig.json` 正确配置路径别名：

```json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"],
      "@config/*": ["config/*"],
      "@services/*": ["services/*"],
      "@middleware/*": ["middleware/*"],
      "@utils/*": ["utils/*"],
      "@types/*": ["types/*"]
    }
  }
}
```

### 4. 自动修复脚本

创建 `scripts/fix-module-alias.js` 脚本，自动处理模块别名问题：

```javascript
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 修复模块别名问题...');

try {
  const backendDir = path.join(__dirname, '..', 'backend');
  
  if (!fs.existsSync(backendDir)) {
    console.log('❌ Backend 目录不存在');
    process.exit(1);
  }

  console.log('📁 进入 backend 目录...');
  process.chdir(backendDir);

  // 检查是否有 src 目录
  if (!fs.existsSync('src')) {
    console.log('❌ src 目录不存在，无法编译');
    process.exit(1);
  }

  // 清理 dist 目录
  if (fs.existsSync('dist')) {
    try {
      fs.rmSync('dist', { recursive: true, force: true });
      console.log('✅ 清理 dist 目录');
    } catch (error) {
      console.log('⚠️ 清理 dist 目录失败，继续...');
    }
  }

  // 重新构建项目
  console.log('🔨 重新构建项目...');
  execSync('npm run build', { stdio: 'inherit' });

  // 验证构建结果
  if (fs.existsSync('dist/index.js')) {
    const content = fs.readFileSync('dist/index.js', 'utf8');
    if (content.includes('module-alias/register') && content.includes('./config/config')) {
      console.log('✅ 模块别名修复成功');
      console.log('✅ 构建文件验证通过');
    } else {
      console.log('❌ 构建文件验证失败');
      process.exit(1);
    }
  } else {
    console.log('❌ 构建文件不存在');
    process.exit(1);
  }

  console.log('🎉 模块别名问题修复完成！');
} catch (error) {
  console.error('❌ 修复失败:', error.message);
  process.exit(1);
}
```

### 5. 更新启动脚本

在 `start.sh` 中添加模块别名修复步骤：

```bash
# 修复模块别名问题
echo "🔧 Fixing module aliases..."
node scripts/fix-module-alias.js || {
    echo "ERROR: Module alias fix failed"
    exit 1
}
```

## 验证修复

修复后，编译的 `dist/index.js` 文件应该包含：

1. `require("module-alias/register")` 在文件开头
2. 所有 `@` 别名都被转换为相对路径（如 `"./config/config"`）

## 部署步骤

1. **清理旧文件**：
   ```bash
   cd backend
   rm -rf dist
   ```

2. **重新构建**：
   ```bash
   npm run build
   ```

3. **验证构建结果**：
   ```bash
   node dist/index.js
   ```

4. **启动服务**：
   ```bash
   npm start
   ```

## 注意事项

- 确保服务器上安装了所有必要的依赖
- 如果使用 PM2，确保重启服务以加载新的构建文件
- 检查日志确认没有模块找不到的错误

## 故障排除

如果仍然出现问题：

1. 检查 `dist/index.js` 文件内容
2. 确认 `module-alias` 已正确安装
3. 验证 `_moduleAliases` 配置是否正确
4. 检查 TypeScript 编译输出

通过以上步骤，模块别名问题应该得到完全解决。
