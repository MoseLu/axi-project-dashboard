# 📚 axi-project-dashboard 文档导航

## 🎯 项目概述

**axi-project-dashboard** 是一个独立的部署进度可视化仪表板，为所有通过 axi-deploy 进行的项目部署提供实时监控和状态跟踪。

- **访问地址**: https://redamancy.com.cn/project-dashboard
- **项目类型**: 独立项目，与 axi-deploy 核心业务完全分离
- **技术栈**: React + Node.js + TypeScript + Ant Design

## 📖 文档分类导航

### 🚀 快速上手
| 文档 | 描述 | 适用场景 |
|------|------|----------|
| **[README.md](../README.md)** | 项目总览和核心特性介绍 | 了解项目概览 |
| **[QUICK_START.md](./QUICK_START.md)** | 快速部署指南 | 首次部署项目 |
| **[PORT_PLANNING.md](./PORT_PLANNING.md)** | 端口配置和冲突避免 | 解决端口冲突问题 |

### 🏗️ 架构设计
| 文档 | 描述 | 适用场景 |
|------|------|----------|
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | 系统架构和技术栈详解 | 了解技术架构 |
| **[SEPARATION.md](./SEPARATION.md)** | 与 axi-deploy 分离机制 | 理解项目独立性 |

### 📦 部署运维
| 文档 | 描述 | 适用场景 |
|------|------|----------|
| **[DEPLOYMENT.md](./DEPLOYMENT.md)** | 完整部署流程和故障排查 | 生产环境部署 |

## 🔍 按使用场景查找

### 👨‍💻 开发者
1. **[README.md](../README.md)** - 了解项目概览
2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - 理解技术架构
3. **[QUICK_START.md](./QUICK_START.md)** - 本地开发环境搭建

### 🚀 运维工程师
1. **[DEPLOYMENT.md](./DEPLOYMENT.md)** - 生产环境部署
2. **[PORT_PLANNING.md](./PORT_PLANNING.md)** - 端口配置管理
3. **[SEPARATION.md](./SEPARATION.md)** - 理解部署分离机制

### 📊 产品经理
1. **[README.md](../README.md)** - 了解功能特性
2. **[QUICK_START.md](./QUICK_START.md)** - 快速体验系统

## 📋 核心功能特性

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

## 🛠️ 技术栈概览

### 前端技术栈
- **React 18** + **TypeScript** - 核心框架
- **Ant Design 5** - UI 组件库
- **ECharts** - 数据可视化
- **Socket.io Client** - 实时通信
- **React Query** - 状态管理

### 后端技术栈
- **Node.js 18+** + **Express.js** - 核心框架
- **TypeScript** - 类型安全
- **Socket.io** - 实时通信
- **MongoDB** - 主数据库
- **Redis** - 缓存和消息队列

### 部署技术栈
- **PM2** - 进程管理
- **Nginx** - 反向代理
- **GitHub Actions** - 自动化部署
- **Docker** - 容器化（可选）

## 🔗 快速链接

### 🌐 在线资源
- **生产环境**: https://redamancy.com.cn/project-dashboard
- **API 文档**: https://redamancy.com.cn/project-dashboard/api-docs
- **健康检查**: https://redamancy.com.cn/project-dashboard/health

### 📁 项目结构
```
axi-project-dashboard/
├── README.md                    # 项目说明
├── documentation/              # 详细文档目录
│   ├── DOCS_INDEX.md          # 本文档索引
│   ├── QUICK_START.md         # 快速开始
│   ├── ARCHITECTURE.md        # 系统架构
│   ├── DEPLOYMENT.md          # 部署指南
│   ├── PORT_PLANNING.md       # 端口规划
│   └── SEPARATION.md          # 业务分离说明
├── backend/                    # 后端服务
├── frontend/                   # 前端应用
└── scripts/                    # 部署脚本
```

## 📞 支持与反馈

如果您在使用过程中遇到问题或有改进建议，请：

1. 查看相关文档
2. 检查 [GitHub Issues](https://github.com/MoseLu/axi-project-dashboard/issues)
3. 提交新的 Issue 或 Pull Request

---

**最后更新**: 2024年8月
**文档版本**: v1.0.0
