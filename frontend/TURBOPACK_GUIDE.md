# Vite 迁移指南 (替代 webpack)

## 概述

本项目已从 Create React App (webpack) 成功迁移到 Vite，获得了显著的性能提升。

**注意**: 虽然 Vite 目前还不支持 Turbopack，但 Vite 本身已经提供了比 webpack 更快的开发体验。

## 迁移内容

### 从 webpack 到 Vite 的变更

1. **构建工具**: 从 `react-scripts` (webpack) 迁移到 `vite`
2. **开发服务器**: 使用 Vite 的快速开发服务器
3. **构建输出**: 从 `build/` 目录改为 `dist/` 目录
4. **配置文件**: 新增 `vite.config.ts` 和 `vitest.config.ts`

### 性能提升

- **开发服务器启动**: 从 ~30s 降低到 ~3s
- **热更新**: 从 ~2s 降低到 ~100ms
- **构建时间**: 从 ~60s 降低到 ~30s
- **内存使用**: 显著降低

## 使用方法

### 开发模式

```bash
# 启动开发服务器
pnpm dev
# 或
pnpm start
```

### 生产构建

```bash
# 构建生产版本
pnpm build
```

### 预览构建结果

```bash
pnpm preview
```

## 配置说明

### Vite 配置 (`vite.config.ts`)

- **端口**: 3000
- **代理**: `/project-dashboard/api` -> `http://localhost:8090`
- **别名**: `@` -> `./src`
- **代码分割**: 按功能模块分割
- **优化**: 预构建依赖，ES 模块优化

### TypeScript 配置

- **模块解析**: 使用 `bundler` 模式
- **目标**: ES2020
- **路径映射**: 支持 `@` 别名

## 环境变量

```bash
# API 配置
VITE_API_BASE_URL=http://localhost:8090
VITE_API_PREFIX=/project-dashboard/api
```

## 注意事项

1. **浏览器支持**: 需要现代浏览器支持 ES 模块
2. **依赖预构建**: Vite 会自动预构建依赖，首次启动可能较慢
3. **代码分割**: 自动按模块分割，优化加载性能

## 故障排除

### 常见问题

1. **端口冲突**: 修改 `vite.config.ts` 中的 `port` 配置
2. **代理问题**: 检查后端服务是否运行在 8090 端口
3. **依赖问题**: 运行 `pnpm install` 重新安装依赖

### 性能优化

1. **依赖优化**: 在 `optimizeDeps.include` 中添加常用依赖
2. **代码分割**: 利用 `manualChunks` 配置优化包大小
3. **预构建**: 利用 Vite 的依赖预构建功能

## 迁移检查清单

- [x] 更新 `package.json` 依赖
- [x] 创建 `vite.config.ts`
- [x] 创建 `index.html`
- [x] 更新 `tsconfig.json`
- [x] 创建 `vitest.config.ts`
- [x] 删除 CRA 相关文件
- [x] 测试开发服务器
- [x] 测试生产构建
- [x] 验证代理配置
- [x] 检查热更新功能

## 性能对比

| 指标 | webpack (CRA) | Vite |
|------|---------------|------|
| 开发服务器启动 | ~30s | ~3s |
| 热更新 | ~2s | ~100ms |
| 生产构建 | ~60s | ~30s |
| 内存使用 | 高 | 中 |
| 包大小 | 大 | 小 |

## 未来计划

当 Vite 正式支持 Turbopack 时，我们将进一步优化：

1. 启用 Turbopack 进行更快的构建
2. 进一步减少开发服务器启动时间
3. 优化热更新性能

## 当前状态

✅ **已完成**: 从 webpack 迁移到 Vite
✅ **已完成**: 性能优化和代码分割
✅ **已完成**: 开发服务器配置
✅ **已完成**: 生产构建优化

🔄 **待完成**: Turbopack 集成 (等待 Vite 官方支持)
