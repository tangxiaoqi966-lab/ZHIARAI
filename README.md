# 多租户Supabase平台

## 项目概述
基于Supabase官方源码进行二次开发的多租户平台，允许用户通过Web仪表板创建独立项目，每个项目获得专用的PostgreSQL数据库、API网关和完整的基础设施栈。

## 🚀 核心特性

### 多租户架构
- **独立项目**：每个用户项目获得完全隔离的环境
- **独立数据库**：专用PostgreSQL容器，数据完全隔离
- **独立API网关**：专用Kong网关实例，独立路由和认证
- **动态资源分配**：自动分配端口、卷、网络配置

### 管理功能
- **Web仪表板**：直观的项目创建、管理和监控界面
- **配置下载**：一键下载Supabase `config.toml`和环境变量
- **项目清理**：完整删除项目及相关资源（容器、卷、配置）

### 安全特性
- **API认证**：JWT风格API密钥认证，保护管理端点
- **HTTPS支持**：Traefik反向代理自动配置HTTPS重定向
- **健康检查**：服务健康状态监控端点
- **密钥管理**：生产环境自动生成强随机密钥

### 生产就绪
- **Docker容器化**：完整容器编排，易于部署和扩展
- **持久化存储**：Docker卷保证数据安全
- **监控端点**：服务状态和性能监控
- **部署文档**：详细的生产环境部署指南

## 📋 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                   前端仪表板 (Next.js/React)                   │
│                       http://localhost:3000                  │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                   平台后端API (Node.js/Express)                │
│                       http://localhost:3002                  │
│        ├── 项目管理 ── 容器编排 ── 密钥生成 ── 配置生成          │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                   Traefik反向代理 (HTTPS终止)                 │
│                    http://localhost:8085 (HTTP)              │
│                    https://localhost:8444 (HTTPS)            │
└───────────────────────────┬─────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
┌─────────▼─────┐   ┌──────▼──────┐   ┌──────▼──────┐
│  项目1数据库   │   │  项目1Kong网关 │   │  项目2数据库   │
│  PostgreSQL   │   │  Kong 2.8.1  │   │  PostgreSQL   │
│  端口: 5433   │   │  端口: 10000  │   │  端口: 5434   │
└───────────────┘   └──────────────┘   └──────────────┘
```

## 🚦 快速开始

### 前提条件
- Docker & Docker Compose
- Node.js 18+ (仅本地开发需要)
- Git

### 1. 克隆仓库
```bash
git clone <repository-url>
cd ZHIRAIbase
```

### 2. 环境配置
```bash
# 复制环境变量示例文件（开发测试使用默认值）
cp .env.example .env
```

### 3. 启动服务
```bash
# 构建并启动所有服务
docker-compose -f docker-compose.platform.yml up --build -d

# 查看服务状态
docker-compose -f docker-compose.platform.yml ps
```

### 4. 访问平台
- **前端仪表板**: http://localhost:3000
- **后端API**: http://localhost:3002
- **API健康检查**: http://localhost:3002/health
- **Traefik管理界面**: http://localhost:8086

### 5. 创建第一个项目
1. 访问 http://localhost:3000
2. 输入项目名称，点击"创建项目"
3. 等待项目部署完成（约30-60秒）
4. 下载项目配置 (`config.toml` 和 `.env` 文件)

## 🔐 安全与密钥管理

### 开发测试阶段
- **默认密钥**: 使用预配置的默认值，便于快速开始
- **API认证**: 可选启用，默认使用 `supabase-platform-secret-key-change-in-production`

### 生产部署阶段
- **自动生成**: 所有密钥必须在生产环境自动生成
- **强随机性**: 使用强随机算法生成密钥（至少32字符）
- **密钥轮换**: 建议每90天轮换关键密钥

### 关键密钥分类
1. **平台级密钥** (部署时生成):
   - `API_KEY`: 平台API认证密钥
   - Traefik TLS证书

2. **项目级密钥** (项目创建时生成):
   - `SUPABASE_JWT_SECRET`: JWT签名密钥
   - `SUPABASE_ANON_KEY`: 客户端API密钥
   - `SUPABASE_SERVICE_ROLE_KEY`: 服务端API密钥
   - `DATABASE_PASSWORD`: 数据库密码

详细说明见 [SECURITY_KEYS.md](SECURITY_KEYS.md)

## 🚢 生产部署

### 完整部署指南
参考 [DEPLOYMENT.md](DEPLOYMENT.md) 获取详细的生产环境部署步骤，包括：
- 服务器准备和系统要求
- 域名配置和HTTPS证书
- 监控和备份策略
- 安全加固和防火墙配置
- 故障排除和紧急恢复

### 环境变量配置
使用 [.env.example](.env.example) 作为模板，生产环境必须：
1. 生成强随机API密钥: `openssl rand -hex 32`
2. 配置真实域名和邮箱
3. 启用所有安全特性

## 🛠️ 技术栈

### 后端服务
- **平台后端**: Node.js + Express + Docker SDK
- **数据库**: PostgreSQL 15+ (每个项目独立容器)
- **API网关**: Kong 2.8.1 (每个项目独立实例)
- **反向代理**: Traefik v2.10 (HTTPS终止、负载均衡)

### 前端界面
- **仪表板**: Next.js 14 + React + TypeScript
- **样式**: Tailwind CSS + Lucide React图标
- **状态管理**: React Hooks + Fetch API

### 开发工具
- **容器编排**: Docker Compose
- **代码质量**: ESLint, Prettier
- **构建工具**: Webpack, Vite

## 📖 基于Supabase官方源码

### 二次开发内容
本项目基于Supabase官方源码进行深度二次开发，主要改进和新增功能包括：

#### 架构扩展
- **多租户支持**: 原始Supabase为单租户，本项目扩展为完整的多租户架构
- **动态资源分配**: 自动创建和配置独立基础设施组件
- **项目隔离**: 每个项目获得完全独立的运行环境

#### 管理功能
- **Web管理界面**: 添加完整的项目管理和监控仪表板
- **配置生成**: 自动生成Supabase兼容的配置文件
- **生命周期管理**: 项目创建、更新、删除的完整生命周期

#### 安全增强
- **API认证**: 添加平台级API密钥认证
- **HTTPS集成**: 集成Traefik实现自动HTTPS
- **健康监控**: 添加服务健康检查和状态监控

#### 部署优化
- **容器化部署**: 完整的Docker Compose编排
- **生产就绪**: 添加生产环境部署指南和安全配置
- **密钥管理**: 完善的密钥生成和管理策略

### 原始Supabase组件
项目中包含的Supabase官方组件：
- **Supabase Studio**: Web管理界面（位于 `supabase/apps/studio/`）
- **Supabase UI组件库**: 共享UI组件（位于 `supabase/packages/ui/`）
- **Supabase配置模板**: 标准配置文件和模板

### 许可证说明
- **Supabase源码**: 遵循原始Supabase项目的许可证
- **新增代码**: MIT许可证（除非另有说明）
- **商业使用**: 请参考Supabase官方商业许可证条款

## 🔄 项目同步到GitHub

### 本地仓库已初始化
项目已初始化为Git仓库，包含：
- 完整的源代码（平台后端、前端仪表板、Supabase源码）
- 详细的文档（README.md, DEPLOYMENT.md, SECURITY_KEYS.md）
- 环境变量模板 (.env.example)
- Docker编排配置 (docker-compose.platform.yml)

### 推送到GitHub仓库
```bash
# 添加远程仓库（替换为您的GitHub仓库URL）
git remote add origin https://github.com/your-username/zhiraibase-platform.git

# 推送代码
git branch -M main
git push -u origin main
```

### GitHub仓库建议
1. **仓库名称**: `zhiraibase-platform` 或 `multi-tenant-supabase`
2. **仓库描述**: "Multi-tenant Supabase platform based on official Supabase source code"
3. **Topics**: `supabase`, `multi-tenant`, `postgresql`, `docker`, `saas`
4. **许可证**: 包含适当的开源许可证文件
5. **README**: 使用本README.md作为基础

## 📈 开发路线图

### 近期计划
- [ ] 完整Supabase服务栈集成 (Auth, Storage, Realtime)
- [ ] 用户管理和认证系统
- [ ] 项目资源使用监控
- [ ] 自动扩缩容支持

### 中期目标
- [ ] Kubernetes部署支持
- [ ] 多区域部署和高可用
- [ ] API速率限制和配额管理
- [ ] 计费和支付集成

### 长期愿景
- [ ] 完整SaaS平台功能
- [ ] 市场和应用模板
- [ ] 开发者生态系统
- [ ] 企业级功能和支持

## 🐛 问题反馈

### 报告问题
- **GitHub Issues**: 报告bug、请求功能、询问问题
- **安全漏洞**: 请通过安全邮件报告，不要公开披露

### 技术支持
- **文档**: 参考 [DEPLOYMENT.md](DEPLOYMENT.md) 和 [SECURITY_KEYS.md](SECURITY_KEYS.md)
- **社区**: 加入Supabase社区获取基础支持
- **商业支持**: 根据需求提供定制化支持服务

## 📄 许可证

### 代码许可证
- **Supabase官方源码**: 遵循原始Supabase许可证
- **平台新增代码**: MIT许可证
- **文档**: Creative Commons Attribution 4.0 International

### 使用条款
1. 遵循原始Supabase项目的使用条款
2. 生产环境使用需进行适当的安全评估
3. 商业用途请确保符合相关法律法规

## 🙏 致谢

### 感谢项目
- **Supabase团队**: 提供了优秀的基础设施和开源代码
- **Docker社区**: 容器化技术和工具支持
- **开源贡献者**: 所有依赖的开源项目和库

### 贡献者
欢迎提交Pull Request和改进建议，共同完善这个多租户平台。

---

**注意**: 本项目为基于Supabase官方源码的二次开发，适用于学习和研究目的。生产环境部署前请进行全面的安全评估和测试。