# VPS 部署指南

本指南说明如何将多租户 Supabase 平台部署到 VPS 服务器。

## 已部署环境

- **服务器**: `145.223.100.249`
- **部署时间**: 2026-03-04
- **安装目录**: `/opt/supabase-platform`
- **部署方式**: 自动化脚本部署 (使用 sshpass)

## 服务详情

| 服务 | 端口 | 访问地址 | 状态 |
|------|------|----------|------|
| 前端仪表板 | 3000 | http://145.223.100.249:3000 | ✅ 运行中 |
| 后端 API | 3002 | http://145.223.100.249:3002 | ✅ 运行中 |
| Traefik Web | 8085 | http://145.223.100.249:8085 | ✅ 运行中 |
| Traefik 管理界面 | 8086 | http://145.223.100.249:8086 | ✅ 运行中 |
| Traefik HTTPS | 8444 | https://145.223.100.249:8444 | ✅ 运行中 |

## 安全配置

- ✅ API 认证已启用 (JWT 风格 API 密钥)
- ✅ 健康检查端点 (`/health`) 可访问
- ✅ HTTPS 重定向配置 (自签名证书)
- ✅ Docker 非 root 用户运行

### API 认证
- **API 密钥**: `9d0d97ddc902ef3c589086798af0f554533c89a4952a9895a3d1a093004893ec`
- **头部名称**: `x-api-key`
- **认证要求**: 除 `/health` 外所有 API 端点

## 部署脚本

部署使用自动化脚本 `deploy-to-vps.sh`，包含以下步骤：

1. **环境检查**: 验证 SSH 连接，检查 Docker 和 Docker Compose
2. **文件传输**: 使用 tar 压缩并传输项目文件，排除临时文件
3. **环境配置**: 生成生产环境配置文件 (`.env`)
4. **服务启动**: 使用 Docker Compose 构建并启动所有服务
5. **验证部署**: 检查容器状态和服务可访问性

### 脚本特性
- **幂等性**: 可重复运行，自动停止并重建容器
- **错误处理**: 失败时自动退出，提供详细日志
- **清理功能**: 自动排除和删除临时文件
- **安全配置**: 自动生成强 API 密钥

## 管理命令

### 查看服务状态
```bash
ssh root@145.223.100.249 "cd /opt/supabase-platform && docker compose -f docker-compose.platform.yml ps"
```

### 查看日志
```bash
# 所有服务日志
ssh root@145.223.100.249 "cd /opt/supabase-platform && docker compose -f docker-compose.platform.yml logs -f"

# 特定服务日志
ssh root@145.223.100.249 "cd /opt/supabase-platform && docker compose -f docker-compose.platform.yml logs -f platform-backend"
```

### 重启服务
```bash
ssh root@145.223.100.249 "cd /opt/supabase-platform && docker compose -f docker-compose.platform.yml restart"
```

### 停止服务
```bash
ssh root@145.223.100.249 "cd /opt/supabase-platform && docker compose -f docker-compose.platform.yml down"
```

### 更新部署
```bash
# 从本地重新部署
./deploy-to-vps.sh
```

## 下一步配置建议

### 1. 域名配置
编辑 `/opt/supabase-platform/.env` 文件：
```bash
TRAEFIK_DOMAIN=your-domain.com
TRAEFIK_ACME_EMAIL=your-email@example.com
```
然后重启服务。

### 2. HTTPS 证书
- 当前使用自签名证书
- 配置域名后可启用 Let's Encrypt 自动证书
- Traefik 已配置 ACME 支持

### 3. 监控和日志
- Traefik 管理界面提供路由监控
- 建议配置日志聚合和监控系统
- 可启用 Docker 日志驱动到外部服务

### 4. 备份策略
- PostgreSQL 数据库卷: `supabase-platform_platform-data`
- 建议定期备份 Docker 卷数据
- 配置文件备份: `.env`, `docker-compose.platform.yml`

## 故障排除

### 服务无法访问
1. 检查防火墙是否开放相应端口 (3000, 3002, 8085, 8086, 8444)
2. 检查容器状态: `docker compose ps`
3. 查看错误日志: `docker compose logs`

### API 认证失败
1. 验证 `x-api-key` 头部是否正确
2. 检查 `.env` 文件中的 `API_KEY` 值
3. 确保健康检查端点不需要认证

### 构建失败 (UTF-8 编码问题)
- 已通过排除临时文件解决
- 如果再次出现，运行清理脚本:
  ```bash
  find /opt/supabase-platform -name '.__*' -delete
  find /opt/supabase-platform -name '._*' -delete
  find /opt/supabase-platform -name '.DS_Store' -delete
  ```

## 架构说明

部署采用三服务架构：

1. **平台后端** (Node.js/Express): 多租户管理，项目创建，API 密钥生成
2. **平台仪表板** (Next.js/React): Web 管理界面，项目监控
3. **Traefik 反向代理**: HTTPS 终止，路由管理，负载均衡

每个用户项目将动态创建独立的 Docker 容器 (PostgreSQL + Kong API 网关)。

## 联系支持

如有问题，请参考：
- 项目文档: [README.md](README.md)
- 部署文档: [DEPLOYMENT.md](DEPLOYMENT.md)
- GitHub 仓库: https://github.com/tangxiaoqi966-lab/ZHIARAI.git