# 安全密钥管理指南

## 概述
本文档描述了多租户Supabase平台中的密钥管理策略，区分开发测试阶段和生产部署阶段的密钥处理方式。

## 密钥分类

### 1. 平台级密钥（需要在生产部署时自动生成/修改）

#### 1.1 API认证密钥
- **环境变量**: `API_KEY`
- **默认值**: `supabase-platform-secret-key-change-in-production`
- **生产要求**: 必须生成强随机字符串（至少32字符）
- **生成时机**: 生产环境初始化时
- **存储位置**: 环境变量或密钥管理服务（如HashiCorp Vault）

#### 1.2 Traefik TLS证书
- **配置**: Traefik自签名证书配置
- **生产要求**: 使用Let's Encrypt或购买的商业证书
- **生成时机**: 部署时自动申请或手动配置

### 2. 项目级密钥（在项目创建时自动生成）

#### 2.1 Supabase JWT密钥
- **变量名**: `SUPABASE_JWT_SECRET`
- **生成方式**: `crypto.randomBytes(32).toString('hex')`
- **长度**: 64字符十六进制字符串
- **用途**: 签名JWT令牌

#### 2.2 API密钥
- **匿名密钥**: `SUPABASE_ANON_KEY` (用于客户端应用)
- **服务角色密钥**: `SUPABASE_SERVICE_ROLE_KEY` (用于服务器端管理)
- **可发布密钥**: `SUPABASE_PUBLISHABLE_KEY`
- **生成方式**: 基于JWT_SECRET和项目引用ID生成
- **用途**: 客户端和服务器端API认证

#### 2.3 数据库密码
- **变量名**: `DATABASE_PASSWORD`
- **生成方式**: `crypto.randomBytes(16).toString('hex')`
- **长度**: 32字符十六进制字符串
- **存储**: PostgreSQL容器环境变量

#### 2.4 项目引用ID
- **变量名**: 项目ID（用于容器命名、卷命名）
- **生成方式**: `crypto.randomBytes(10).toString('hex')`
- **长度**: 20字符十六进制字符串

### 3. 服务配置密钥

#### 3.1 Kong API网关配置
- **配置方式**: Base64编码的YAML配置
- **包含内容**: 
  - 上游服务地址（动态端口）
  - 路由规则
  - 插件配置（CORS、认证等）

#### 3.2 PostgreSQL配置
- **数据库名称**: `postgres` (固定)
- **用户名**: `postgres` (固定)
- **密码**: 自动生成的强密码

## 开发测试阶段配置

### 默认值（安全但方便开发）
```bash
# docker-compose.platform.yml中的默认值
API_KEY=supabase-platform-secret-key-change-in-production
```

### 开发环境建议
1. **保持默认值**：便于团队协作和CI/CD测试
2. **本地开发**：可以使用默认值，但建议定期轮换
3. **测试数据**：使用测试专用密钥，与生产环境隔离

## 生产部署配置

### 自动生成脚本示例
```bash
#!/bin/bash
# generate-production-secrets.sh

# 生成平台API密钥
export API_KEY=$(openssl rand -hex 32)

# 生成环境变量文件
cat > .env.production << EOF
# 平台配置
API_AUTH_ENABLED=true
API_KEY=${API_KEY}

# Traefik配置（使用真实域名）
TRAEFIK_DOMAIN=your-production-domain.com
TRAEFIK_ACME_EMAIL=admin@your-domain.com
EOF

# 启动服务
docker-compose -f docker-compose.platform.yml up -d
```

### 密钥存储最佳实践
1. **环境变量**：使用`.env`文件（不提交到版本控制）
2. **密钥管理服务**：推荐使用HashiCorp Vault、AWS Secrets Manager等
3. **加密存储**：敏感密钥应加密存储，运行时解密
4. **定期轮换**：建议每90天轮换一次关键密钥

### 部署流程
1. **初始化阶段**：生成所有平台级密钥
2. **项目创建时**：自动生成项目级密钥
3. **密钥注入**：通过环境变量注入到容器
4. **验证阶段**：验证所有密钥是否正确配置

## 安全注意事项

### 必须避免的做法
- ❌ 将硬编码密钥提交到版本控制系统
- ❌ 在生产环境使用默认密钥
- ❌ 密钥复用（不同环境使用相同密钥）
- ❌ 明文记录密钥在文档或代码注释中

### 推荐做法
- ✅ 使用密钥管理服务
- ✅ 实施最小权限原则
- ✅ 启用审计日志记录密钥访问
- ✅ 定期安全扫描和密钥轮换

## 故障排除

### 常见问题
1. **API认证失败**：检查`API_KEY`环境变量是否正确设置
2. **数据库连接失败**：验证数据库密码是否正确生成和注入
3. **Kong配置错误**：检查Base64编码的配置是否完整

### 紧急恢复
如果密钥泄露或丢失：
1. 立即轮换所有受影响密钥
2. 更新环境变量和配置文件
3. 重启相关服务
4. 审查审计日志，确定泄露范围

## 附录

### 密钥生成代码位置
- `platform-backend/projectService.js`：`generateJwtSecret()`, `generateAnonKey()`, 等函数
- `platform-backend/index.js`：配置验证函数`validateConfig()`

### 相关文件
- `docker-compose.platform.yml`：环境变量默认配置
- `.env.example`：环境变量模板
- `SECURITY_KEYS.md`：本文档