# 多租户Supabase平台部署指南

## 项目概述
这是一个基于官方Supabase源码进行二次开发的多租户Supabase平台，允许用户通过Web仪表板创建独立项目，每个项目获得专用的PostgreSQL数据库和API网关。

## 架构组件
- **平台后端** (Node.js/Express)：项目管理API，容器编排
- **前端仪表板** (Next.js/React)：用户界面，项目管理
- **Traefik反向代理**：HTTPS终止，路由管理
- **PostgreSQL数据库**：每个项目独立容器
- **Kong API网关**：每个项目独立网关实例

## 快速开始（开发环境）

### 1. 前提条件
- Docker & Docker Compose
- Node.js 18+ (仅用于本地开发)
- Git

### 2. 克隆仓库
```bash
git clone <repository-url>
cd ZHIRAIbase
```

### 3. 环境配置
```bash
# 复制环境变量示例文件
cp .env.example .env

# 保持默认值用于开发测试
# 或根据需要修改 .env 文件
```

### 4. 启动服务
```bash
# 构建并启动所有服务
docker-compose -f docker-compose.platform.yml up --build -d

# 查看服务状态
docker-compose -f docker-compose.platform.yml ps
```

### 5. 访问平台
- **前端仪表板**: http://localhost:3000
- **后端API**: http://localhost:3002
- **Traefik管理界面**: http://localhost:8086
- **API健康检查**: http://localhost:3002/health

## 生产环境部署

### 1. 安全准备

#### 1.1 生成生产密钥
```bash
# 生成强随机API密钥
export API_KEY=$(openssl rand -hex 32)

# 创建生产环境配置文件
cp .env.example .env.production

# 编辑 .env.production，替换以下值：
# - API_KEY=生成的强密钥
# - TRAEFIK_DOMAIN=您的生产域名
# - TRAEFIK_ACME_EMAIL=您的邮箱
# - 取消注释并配置其他生产环境变量
```

#### 1.2 配置域名DNS
- 将您的域名A记录指向服务器IP
- 确保端口80和443可公开访问

### 2. 服务器准备

#### 2.1 系统要求
- Ubuntu 20.04+ 或 CentOS 8+
- 至少4GB RAM，2核CPU
- 50GB+ 磁盘空间
- Docker & Docker Compose 已安装

#### 2.2 安装依赖
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y docker.io docker-compose git openssl

# CentOS/RHEL
sudo yum install -y docker git openssl
sudo systemctl start docker
sudo systemctl enable docker

# 添加用户到docker组
sudo usermod -aG docker $USER
```

### 3. 部署步骤

#### 3.1 获取代码
```bash
git clone <repository-url> /opt/supabase-platform
cd /opt/supabase-platform
```

#### 3.2 配置环境
```bash
# 使用预生成的生产环境配置
cp .env.production .env

# 或使用环境变量注入
export API_KEY="your-generated-api-key"
export TRAEFIK_DOMAIN="your-domain.com"
```

#### 3.3 启动服务
```bash
# 生产环境部署（后台运行）
docker-compose -f docker-compose.platform.yml up --build -d

# 查看日志
docker-compose -f docker-compose.platform.yml logs -f
```

#### 3.4 验证部署
```bash
# 检查容器状态
docker ps

# 测试API端点
curl -H "x-api-key: ${API_KEY}" https://${TRAEFIK_DOMAIN}/api/projects

# 测试健康检查
curl https://${TRAEFIK_DOMAIN}/health
```

### 4. HTTPS配置

#### 4.1 自动证书（Let's Encrypt）
Traefik已配置自动证书获取，确保：
- 域名解析正确
- 服务器80和443端口开放
- 邮箱地址有效

#### 4.2 手动证书（已有证书）
```yaml
# 在docker-compose.platform.yml中修改Traefik配置
traefik:
  # ... 其他配置
  volumes:
    - /path/to/certificates:/etc/certificates
  command:
    - "--entrypoints.websecure.tls.certificates=certificates"
```

### 5. 监控与维护

#### 5.1 服务监控
```bash
# 查看实时日志
docker-compose -f docker-compose.platform.yml logs -f

# 资源使用情况
docker stats

# 容器健康状态
docker ps --format "table {{.Names}}\t{{.Status}}"
```

#### 5.2 备份策略
```bash
# 备份数据库卷
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/supabase-platform"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份所有Docker卷
docker run --rm -v platform-data:/data -v $BACKUP_DIR:/backup alpine \
  tar czf /backup/platform-data-$DATE.tar.gz -C /data .

# 保留最近7天备份
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

#### 5.3 更新部署
```bash
# 拉取最新代码
cd /opt/supabase-platform
git pull

# 重建并重启服务
docker-compose -f docker-compose.platform.yml up --build -d

# 执行数据库迁移（如有）
# 根据具体需求添加迁移脚本
```

### 6. 安全加固

#### 6.1 防火墙配置
```bash
# 仅开放必要端口
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

#### 6.2 Docker安全
```bash
# 定期更新Docker镜像
docker-compose -f docker-compose.platform.yml pull

# 扫描安全漏洞
docker scan zhiraibase-platform-backend
```

#### 6.3 密钥轮换
```bash
# 轮换API密钥
export NEW_API_KEY=$(openssl rand -hex 32)
sed -i "s/API_KEY=.*/API_KEY=${NEW_API_KEY}/" .env
docker-compose -f docker-compose.platform.yml up -d
```

## 故障排除

### 常见问题

#### 1. 容器启动失败
```bash
# 查看详细错误信息
docker-compose -f docker-compose.platform.yml logs

# 检查端口冲突
netstat -tulpn | grep -E "(3000|3002|8085|8086|8444)"
```

#### 2. HTTPS证书问题
```bash
# 检查Traefik证书状态
docker logs zhiraibase-traefik-1 | grep -i certificate

# 手动申请证书
docker exec zhiraibase-traefik-1 traefik --certificatesresolvers.selfsigned.acme
```

#### 3. API认证失败
```bash
# 验证API密钥配置
echo $API_KEY

# 测试API端点
curl -v -H "x-api-key: ${API_KEY}" http://localhost:3002/api/projects
```

#### 4. 数据库连接问题
```bash
# 检查PostgreSQL容器状态
docker ps | grep postgres

# 查看数据库日志
docker logs supabase-db-<project-id>
```

## 扩展与定制

### 添加新服务
1. 在`docker-compose.platform.yml`中定义新服务
2. 更新`projectService.js`中的资源配置逻辑
3. 在前端仪表板中添加对应界面

### 集成监控栈
```yaml
# 在docker-compose.platform.yml中添加
prometheus:
  image: prom/prometheus
  ports:
    - "9090:9090"
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml

grafana:
  image: grafana/grafana
  ports:
    - "3001:3000"
```

### 多服务器部署
对于高可用需求，考虑：
1. 使用Docker Swarm或Kubernetes
2. 配置共享存储（NFS、Ceph）
3. 实现负载均衡和故障转移

## 技术支持

### 文档
- `SECURITY_KEYS.md` - 密钥管理指南
- `.env.example` - 环境变量模板
- `docker-compose.platform.yml` - 服务配置

### 基于官方源码
本项目基于Supabase官方源码进行二次开发，主要改进包括：
- 多租户架构支持
- 动态项目创建和管理
- 集成Web管理仪表板
- 增强的安全特性

### 问题反馈
- GitHub Issues: 报告bug和功能请求
- 安全漏洞: 通过安全邮件报告

## 版本历史
- v1.0.0: 初始版本，基础多租户功能
- v1.1.0: 添加API认证、HTTPS支持、健康检查
- 未来计划: 完整Supabase服务栈集成、监控告警、自动扩缩容