# 多阶段构建 - 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制包文件
COPY package*.json ./
COPY tsconfig.json ./

# 安装依赖（包括开发依赖）
RUN npm ci --include=dev

# 复制源代码
COPY src/ ./src/

# 构建应用
RUN npm run build

# 生产阶段
FROM node:18-alpine AS production

# 创建应用用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 设置工作目录
WORKDIR /app

# 复制包文件
COPY package*.json ./

# 只安装生产依赖
RUN npm ci --only=production && npm cache clean --force

# 从构建阶段复制构建产物
COPY --from=builder /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist

# 创建必要的目录
RUN mkdir -p logs uploads && \
    chown -R nextjs:nodejs logs uploads

# 切换到非 root 用户
USER nextjs

# 暴露端口
EXPOSE 8080 8081

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# 启动应用
CMD ["node", "dist/index.js"]
