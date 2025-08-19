# 项目结构说明

## 📁 目录结构

```
axi-project-dashboard/
├── 📁 backend/                    # 后端服务
│   ├── src/                      # 源代码
│   │   ├── config/               # 配置模块
│   │   ├── database/             # 数据库模块
│   │   ├── middleware/           # 中间件
│   │   ├── routes/               # 路由定义
│   │   ├── services/             # 业务服务
│   │   ├── types/                # 类型定义
│   │   └── utils/                # 工具函数
│   ├── config/                   # 配置文件
│   ├── scripts/                  # 脚本文件
│   └── package.json              # 依赖配置
├── 📁 frontend/                  # 前端应用
│   ├── src/                      # 源代码
│   │   ├── components/           # 通用组件
│   │   ├── pages/                # 页面组件
│   │   ├── hooks/                # 自定义钩子
│   │   ├── utils/                # 工具函数
│   │   └── types/                # 类型定义
│   ├── public/                   # 静态资源
│   └── package.json              # 依赖配置
├── 📁 config/                    # 监控系统配置
│   ├── prometheus.yml            # Prometheus 配置
│   ├── alert_rules.yml           # 告警规则
│   ├── alertmanager.yml          # AlertManager 配置
│   ├── blackbox.yml              # 黑盒监控配置
│   └── grafana/                  # Grafana 配置
├── 📁 scripts/                   # 运维脚本
│   ├── deploy-monitoring.sh      # 监控系统部署
│   ├── test-monitoring.js        # 监控系统测试
│   └── utils/                    # 工具脚本
├── 📁 docs/                      # 项目文档
│   ├── monitoring/               # 监控系统文档
│   ├── deployment/               # 部署文档
│   └── api/                      # API 文档
├── 📁 deployment/                # 部署相关
│   ├── docker/                   # Docker 配置
│   │   └── docker-compose.monitoring.yml
│   ├── kubernetes/               # K8s 配置
│   └── scripts/                  # 部署脚本
│       ├── ecosystem.config.js   # PM2 配置
│       ├── start-*.sh           # 启动脚本
│       └── frontend-server.js   # 前端服务器
├── 📁 tools/                     # 开发工具
│   ├── debug/                    # 调试工具
│   │   ├── debug-*.js           # 调试脚本
│   │   └── fix-*.js             # 修复脚本
│   ├── test/                     # 测试工具
│   │   └── test-*.js            # 测试脚本
│   └── analysis/                 # 分析工具
│       ├── analyze-*.js         # 分析脚本
│       ├── check-*.js           # 检查脚本
│       └── diagnose-*.js        # 诊断脚本
├── 📁 .github/                   # GitHub Actions
├── 📁 documentation/             # 旧版文档（待迁移）
├── 📁 node_modules/              # 依赖包
├── docker-compose.yml            # 开发环境
├── package.json                  # 根包配置
├── pnpm-workspace.yaml           # 工作区配置
├── pnpm-lock.yaml                # 锁文件
├── .gitignore                    # Git 忽略文件
├── README.md                     # 项目说明
├── MONITORING_UPGRADE.md         # 监控系统升级指南
└── PROJECT_STRUCTURE.md          # 项目结构说明
```

## 🔄 文件迁移说明

### 已迁移的文件

#### 部署相关
- `docker-compose.monitoring.yml` → `deployment/docker/`
- `ecosystem.config.js` → `deployment/scripts/`
- `start-*.sh` → `deployment/scripts/`
- `frontend-server.js` → `deployment/scripts/`

#### 调试工具
- `debug-*.js` → `tools/debug/`
- `fix-*.js` → `tools/debug/`

#### 测试工具
- `test-*.js` → `tools/test/`

#### 分析工具
- `analyze-*.js` → `tools/analysis/`
- `check-*.js` → `tools/analysis/`
- `diagnose-*.js` → `tools/analysis/`

#### 文档
- `PRODUCTION_DEPLOYMENT_GUIDE.md` → `docs/deployment/`
- `MONITORING_README.md` → `docs/monitoring/`

### 待处理的文件

#### 根目录文件
- `DEPLOYMENT_502_FIX.md` - 部署修复文档
- `pnpm-workspace.yaml` - 工作区配置
- `pnpm-lock.yaml` - 锁文件
- `package.json` - 根包配置

#### 文档目录
- `documentation/` - 旧版文档目录（需要迁移到 `docs/`）

## 📋 目录说明

### backend/
后端服务目录，包含 Node.js + Express + TypeScript 应用
- **src/**: 源代码目录
- **config/**: 配置文件目录
- **scripts/**: 脚本文件目录

### frontend/
前端应用目录，包含 React + TypeScript + Ant Design 应用
- **src/**: 源代码目录
- **public/**: 静态资源目录

### config/
监控系统配置文件目录
- **prometheus.yml**: Prometheus 监控配置
- **alert_rules.yml**: 告警规则配置
- **alertmanager.yml**: AlertManager 配置
- **blackbox.yml**: 黑盒监控配置
- **grafana/**: Grafana 配置目录

### scripts/
运维脚本目录
- **deploy-monitoring.sh**: 监控系统部署脚本
- **test-monitoring.js**: 监控系统测试脚本
- **utils/**: 工具脚本目录

### docs/
项目文档目录
- **monitoring/**: 监控系统相关文档
- **deployment/**: 部署相关文档
- **api/**: API 文档

### deployment/
部署相关目录
- **docker/**: Docker 配置文件
- **kubernetes/**: Kubernetes 配置文件
- **scripts/**: 部署脚本

### tools/
开发工具目录
- **debug/**: 调试工具和脚本
- **test/**: 测试工具和脚本
- **analysis/**: 分析和诊断工具

## 🎯 整理目标

### 已完成
- ✅ 创建新的目录结构
- ✅ 迁移部署相关文件
- ✅ 迁移调试和分析工具
- ✅ 迁移部分文档

### 待完成
- 🔄 迁移剩余文档文件
- 🔄 更新相关脚本中的路径引用
- 🔄 清理根目录冗余文件
- 🔄 更新 README 中的路径说明

## 📝 注意事项

1. **路径更新**: 迁移文件后需要更新相关脚本中的路径引用
2. **文档同步**: 确保文档中的路径说明与实际结构一致
3. **脚本测试**: 迁移后需要测试所有脚本是否正常工作
4. **版本控制**: 确保 Git 历史记录正确跟踪文件移动

## 🔧 后续工作

1. **路径修复**: 更新所有脚本中的文件路径
2. **文档更新**: 更新 README 和其他文档中的路径说明
3. **脚本测试**: 验证所有迁移的脚本功能正常
4. **清理工作**: 删除根目录中的冗余文件
