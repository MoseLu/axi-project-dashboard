# 🏗️ 微服务架构与消息队列系统

## 📋 概述

axi-project-dashboard 现已升级为基于微服务架构的实时监控系统，采用 Redis 消息队列实现发布订阅模式。

## 🏛️ 核心组件

### 1. EventPublisherService (事件发布服务)
- 向 Redis 消息队列发布部署事件、项目状态事件、系统事件
- 支持实时事件推送

### 2. EventSubscriberService (事件订阅服务)
- 从 Redis 消息队列订阅和处理事件
- 自动处理部署状态更新和项目状态变化

### 3. RealTimeMonitorService (实时监控服务)
- 整合所有监控功能
- 全天候项目状态监控（60秒间隔）
- 自动事件发布和订阅

## 🔄 消息队列架构

### 事件类型
- **deployment:events** - 部署事件
- **project:status:events** - 项目状态事件  
- **system:events** - 系统事件

## 📊 数据流

```
axi-deploy → Webhook → API → 事件发布 → Redis 队列 → 事件订阅 → 数据库 → WebSocket → 前端
```

## 🔧 API 接口

- `GET /api/monitoring/status` - 获取监控状态
- `POST /api/monitoring/trigger` - 手动触发监控
- `POST /api/monitoring/publish-deployment` - 发布部署事件
- `POST /api/monitoring/publish-project-status` - 发布项目状态事件

## 🎯 优势特性

1. **实时性**: 毫秒级响应，WebSocket 实时推送
2. **可扩展性**: 微服务架构，支持高并发
3. **可靠性**: 完善的错误处理和重试机制
4. **全天候监控**: 60秒间隔自动检查项目状态
