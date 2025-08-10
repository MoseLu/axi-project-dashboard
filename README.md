# 🚀 axi-project-dashboard

## 📋 概述

这是一个独立的部署进度可视化仪表板，为所有通过 axi-deploy 进行的项目部署提供实时监控和状态跟踪。

## ⚠️ 重要：独立项目说明

**axi-project-dashboard 是完全独立的项目**：
- 与 axi-deploy 核心业务完全分离，独立仓库管理
- 拥有独立的部署流程、配置管理和版本控制
- 使用 axi-deploy 的基础设施进行部署，但运行时完全独立

## 🚀 快速开始

### 📦 生产部署

1. **配置 GitHub Secrets**
   在仓库设置中添加必要的部署密钥：
   ```
   SERVER_HOST=redamancy.com.cn
   SERVER_USER=deploy
   SERVER_KEY=<SSH 私钥>
   SERVER_PORT=22
   DEPLOY_CENTER_PAT=<GitHub Token>
   ```

2. **触发部署**
   ```bash
   git push origin main  # 推送代码自动部署
   ```

3. **访问 Dashboard**
   ```
   https://redamancy.com.cn/project-dashboard
   ```

### 🔍 监控功能

部署完成后，Dashboard 提供以下监控功能：

- **实时部署状态**: 监控所有通过 axi-deploy 的项目部署
- **详细日志查看**: 每个部署步骤的执行日志和错误信息  
- **性能指标**: 部署时间、成功率、重试次数统计
- **WebSocket 实时更新**: 无需刷新页面即可看到最新状态

## 📖 文档导航

- **[📚 文档索引](./documentation/DOCS_INDEX.md)** - 完整文档导航
- **[快速开始](./documentation/QUICK_START.md)** - 详细部署指南
- **[端口规划](./documentation/PORT_PLANNING.md)** - 端口配置和冲突避免
- **[系统架构](./documentation/ARCHITECTURE.md)** - 技术架构说明
- **[部署指南](./documentation/DEPLOYMENT.md)** - 完整部署流程

## ✨ 核心特性

### 🔄 实时部署监控
- 实时显示每个项目的部署进度和状态
- 工作流步骤状态追踪（进行中、成功、失败、重试中）
- WebSocket 实时数据推送
- 自动刷新和状态同步

### 📊 详细执行信息
- 每个步骤的执行时间、日志和错误信息
- 重试机制可视化展示
- 性能指标和历史趋势分析
- 详细的错误诊断和故障排除

### 🏗️ 高性能架构
- 前端虚拟化技术支持大规模数据展示
- 后端数据缓存和聚合优化
- 分布式架构支持水平扩展
- 智能数据分页和懒加载

### 🔐 安全与权限
- 细粒度权限管理系统
- 基于角色的访问控制 (RBAC)
- 完整的操作审计日志
- 安全的 API 认证机制

### 🎨 用户体验
- 响应式设计，支持多设备访问
- 多视图模式（项目视图、步骤视图、时间线视图）
- 个性化仪表板配置
- 实时通知和告警系统

## 📁 项目结构

```
axi-project-dashboard/
├── README.md                    # 项目说明
├── env.example                  # 本地开发环境配置模板
├── ecosystem.config.js          # PM2 生产部署配置
├── .github/workflows/           # GitHub Actions 自动部署
│   ├── deploy.yml              # 主部署工作流
│   └── manual-deploy.yml       # 手动部署工作流
├── backend/                     # 后端服务 (Node.js + Express)
│   ├── src/                    # 源码目录
│   ├── package.json            # 后端依赖
│   └── tsconfig.json           # TypeScript 配置
├── frontend/                    # 前端应用 (React + TypeScript)
│   ├── src/                    # 源码目录
│   ├── package.json            # 前端依赖
│   └── tsconfig.json           # TypeScript 配置
└── documentation/              # 详细文档
    ├── DOCS_INDEX.md          # 文档索引
    ├── QUICK_START.md         # 快速开始
    ├── ARCHITECTURE.md        # 系统架构
    ├── DEPLOYMENT.md          # 部署指南
    └── PORT_PLANNING.md       # 端口规划
```

## 🏛️ 系统架构

```
GitHub Webhook → Nginx (443) → React 前端 + Node.js 后端 (8090/8091) → MongoDB + Redis
                   ↓
     https://redamancy.com.cn/project-dashboard
```

**技术栈**:
- **前端**: React 18 + TypeScript + Ant Design + Socket.io Client
- **后端**: Node.js + Express + Socket.io + MongoDB + Redis (端口: 8090/8091)
- **部署**: PM2 + Nginx + 云服务器 + GitHub Actions

## ⚙️ 配置说明

### `env.example` 文件用途

`env.example` 是**环境配置参考文件**：

- **主要用途**: 提供生产环境配置的参考模板
- **实际配置**: 生产环境使用 `ecosystem.config.js` 中的配置
- **敏感信息**: 通过 GitHub Secrets 安全传递

### 核心配置项

- **端口配置**: 8090 (API), 8091 (WebSocket) - 避免与其他项目冲突
- **数据库**: MongoDB + Redis (云服务器本地实例)
- **GitHub 集成**: 通过 API 监控部署状态，接收 Webhook 事件
- **前端连接**: 通过 Nginx 代理访问后端服务

## 🛠️ 技术特色

### 云端部署优势

- **零本地依赖**: 完全云端运行，无需本地环境搭建
- **自动化部署**: Git 推送即触发部署，无需手动操作
- **高可用架构**: PM2 进程管理 + Nginx 负载均衡
- **实时监控**: WebSocket 长连接，实时推送部署状态

### 性能优化

- **端口隔离**: 专用端口段避免冲突
- **缓存策略**: Redis 缓存提升响应速度  
- **CDN 加速**: 静态资源缓存优化
- **压缩传输**: Gzip 压缩减少带宽占用

## 🚀 快速开始

详细部署指南请参考 [快速开始文档](./documentation/QUICK_START.md)

### 简化部署步骤

1. **服务器初始化**
   ```bash
   # 在云服务器上运行
   curl -fsSL https://raw.githubusercontent.com/your-org/axi-deploy/main/dashboard/scripts/setup.sh | bash
   ```

2. **配置 GitHub Secrets**
   在 axi-deploy 仓库设置中添加服务器相关的 Secrets

3. **推送代码触发部署**
   ```bash
   git add dashboard/
   git commit -m "feat: add axi-deploy dashboard"
   git push origin main
   ```

4. **访问仪表板**
   https://redamancy.com.cn/project-dashboard

## 🔧 配置说明

### 核心配置项

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | development |
| `PORT` | 服务端口 | 8080 |
| `MONGODB_URI` | MongoDB 连接字符串 | mongodb://localhost:27017/axi-deploy |
| `REDIS_URI` | Redis 连接字符串 | redis://localhost:6379 |
| `GITHUB_TOKEN` | GitHub API Token | - |
| `JWT_SECRET` | JWT 密钥 | - |
| `WEBSOCKET_PORT` | WebSocket 端口 | 8081 |

### GitHub Webhooks 配置

为了实现实时数据同步，需要在 GitHub 仓库中配置 Webhooks：

1. 进入仓库 Settings > Webhooks
2. 添加新的 Webhook:
   - Payload URL: `https://your-dashboard.com/api/webhooks/github`
   - Content type: `application/json`
   - Events: `Workflow runs`, `Workflow jobs`

## 📊 功能特性

### 1. 实时部署监控

- **全局概览**: 所有项目的部署状态总览
- **项目详情**: 单个项目的详细部署信息
- **步骤跟踪**: 每个工作流步骤的实时状态
- **进度条**: 可视化部署进度展示

### 2. 智能重试管理

- **重试可视化**: 重试步骤与原步骤的清晰区分
- **重试统计**: 重试次数、间隔时间、成功率统计
- **失败分析**: 详细的失败原因和解决建议
- **自动重试**: 智能重试策略和阈值设置

### 3. 性能分析

- **部署时间**: 平均部署时间和趋势分析
- **成功率**: 部署成功率统计和对比
- **资源使用**: CPU、内存、网络使用情况
- **瓶颈识别**: 自动识别性能瓶颈和优化建议

### 4. 告警通知

- **实时告警**: 部署失败、超时等异常告警
- **多渠道通知**: 邮件、Slack、企业微信等
- **告警规则**: 自定义告警条件和阈值
- **通知模板**: 个性化通知消息模板

### 5. 用户管理

- **角色权限**: 管理员、运维、开发者等角色
- **项目权限**: 细粒度的项目访问控制
- **操作审计**: 完整的用户操作记录
- **单点登录**: 支持 OAuth2、LDAP 等认证方式

## 🔐 安全特性

### 权限管理
- 基于角色的访问控制 (RBAC)
- 细粒度权限配置
- API 接口权限验证
- 敏感信息脱敏显示

### 审计日志
- 完整的用户操作记录
- API 调用日志
- 数据变更追踪
- 定期日志归档

### 数据安全
- 数据传输加密 (HTTPS/WSS)
- 敏感数据存储加密
- 定期安全扫描
- 备份与恢复策略

## 📈 性能优化

### 前端优化
- 虚拟滚动 (Virtual Scrolling)
- 组件懒加载 (Lazy Loading)
- 数据分页和筛选
- 图表渲染优化

### 后端优化
- 数据缓存策略 (Redis)
- 数据库索引优化
- API 响应缓存
- 连接池管理

### 架构优化
- 微服务架构
- 负载均衡
- 水平扩展支持
- CDN 静态资源加速

## 🔗 集成能力

### GitHub 集成
- Workflow 状态同步
- Actions 日志获取
- Webhook 事件处理
- API 限流管理

### 监控集成
- Prometheus 指标收集
- Grafana 图表展示
- 自定义监控面板
- 告警规则配置

### 第三方服务
- Slack 通知
- 邮件服务
- 企业微信
- 钉钉机器人

## 🧪 测试策略

### 单元测试
- 组件测试覆盖率 > 80%
- API 接口测试
- 数据库操作测试
- 工具函数测试

### 集成测试
- API 集成测试
- 数据库集成测试
- 外部服务集成测试
- 端到端测试

### 性能测试
- 负载测试
- 压力测试
- 并发测试
- 内存泄漏测试

## 📚 文档资源

- **[📚 文档索引](./documentation/DOCS_INDEX.md)** - 完整文档导航
- **[快速开始](./documentation/QUICK_START.md)** - 详细部署指南
- **[系统架构](./documentation/ARCHITECTURE.md)** - 技术架构说明
- **[部署指南](./documentation/DEPLOYMENT.md)** - 完整部署流程
- **[端口规划](./documentation/PORT_PLANNING.md)** - 端口配置说明

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证。详情请参阅 [LICENSE](LICENSE) 文件。

## 📞 技术支持

- 📧 邮箱: admin@example.com
- 💬 Slack: #axi-deploy-support
- 📖 Wiki: [项目 Wiki](https://github.com/your-org/axi-deploy/wiki)
- 🐛 Bug 报告: [GitHub Issues](https://github.com/your-org/axi-deploy/issues)

---

**版本**: v1.0.0  
**最后更新**: 2024年12月  
**维护者**: 运维团队  
