# 多阶段构建：构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./
COPY tsconfig.json ./

# 安装依赖（包括开发依赖，因为需要构建）
RUN npm ci --only=production && npm cache clean --force

# 复制源代码
COPY src/ ./src/

# 构建TypeScript代码
RUN npm run build

# 生产运行阶段
FROM node:18-alpine

WORKDIR /app

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 复制构建产物和依赖
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# 复制其他必要文件
COPY --chown=nodejs:nodejs .env.example ./.env.example

# 切换到非root用户
USER nodejs

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (r) => {if (r.statusCode === 200) process.exit(0); else process.exit(1)}).on('error', () => process.exit(1))"

# 暴露端口
EXPOSE 3001

# 启动命令
CMD ["node", "dist/index.js"]