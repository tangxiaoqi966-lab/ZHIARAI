#!/bin/bash

# 多租户Supabase平台部署脚本
# 目标服务器: root@145.223.100.249
# 密码: Xtang@950825

set -e  # 任何命令失败则退出脚本

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== 多租户Supabase平台部署脚本 ===${NC}"
echo "目标服务器: 145.223.100.249"
echo "开始时间: $(date)"

# 检查 sshpass 是否安装
if ! command -v sshpass &> /dev/null; then
    echo -e "${RED}错误: sshpass 未安装，请先安装 sshpass${NC}"
    echo "Ubuntu/Debian: sudo apt install sshpass"
    echo "macOS: brew install hudochenkov/sshpass/sshpass"
    exit 1
fi

# 定义变量
SERVER="145.223.100.249"
USER="root"
PASSWORD="Xtang@950825"
REMOTE_DIR="/opt/supabase-platform"
LOCAL_DIR="$(pwd)"

# 函数：执行远程命令
run_remote() {
    local cmd="$1"
    sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 "$USER@$SERVER" "$cmd"
}

# 函数：复制文件到远程
copy_to_remote() {
    local src="$1"
    local dst="$2"
    sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no -o ConnectTimeout=30 -r "$src" "$USER@$SERVER:$dst"
}

# 步骤1: 检查服务器连通性
echo -e "\n${YELLOW}[1/6] 检查服务器连通性...${NC}"
if run_remote "echo '连接测试成功'" &> /dev/null; then
    echo -e "${GREEN}✓ SSH 连接成功${NC}"
else
    echo -e "${RED}✗ 无法连接到服务器，请检查网络和凭据${NC}"
    exit 1
fi

# 步骤2: 检查并安装Docker和Docker Compose
echo -e "\n${YELLOW}[2/6] 检查服务器环境...${NC}"
if run_remote "command -v docker" &> /dev/null; then
    echo -e "${GREEN}✓ Docker 已安装${NC}"
    run_remote "docker --version"
    # 检查docker compose插件
    if run_remote "docker compose version" &> /dev/null; then
        echo -e "${GREEN}✓ Docker Compose 插件已安装${NC}"
        run_remote "docker compose version"
    else
        echo -e "${YELLOW}安装 Docker Compose 插件...${NC}"
        run_remote "apt update && apt install -y docker-compose-plugin"
        echo -e "${GREEN}✓ Docker Compose 插件安装完成${NC}"
    fi
else
    echo -e "${YELLOW}正在安装 Docker...${NC}"
    run_remote "apt update && apt install -y docker.io docker-compose-plugin git openssl"
    run_remote "systemctl start docker"
    run_remote "systemctl enable docker"
    echo -e "${GREEN}✓ Docker 安装完成${NC}"
fi

# 步骤3: 创建远程目录
echo -e "\n${YELLOW}[3/6] 准备远程目录...${NC}"
run_remote "mkdir -p $REMOTE_DIR"
echo -e "${GREEN}✓ 远程目录创建完成: $REMOTE_DIR${NC}"

# 步骤4: 复制项目文件到服务器
echo -e "\n${YELLOW}[4/6] 复制项目文件到服务器...${NC}"
echo "正在复制文件，这可能需要一些时间..."

# 创建临时tar包
TEMP_TAR="/tmp/supabase-platform-$(date +%s).tar.gz"
echo "创建本地压缩包..."
tar --exclude='.git' --exclude='node_modules' --exclude='.env' --exclude='*.log' \
    --exclude='.DS_Store' --exclude='.__*' --exclude='._*' --exclude='*.swp' --exclude='*.swo' \
    --exclude='.idea' --exclude='.vscode' --exclude='*.bak' --exclude='*.tmp' \
    -czf "$TEMP_TAR" .

# 复制压缩包到服务器
echo "上传压缩包到服务器..."
copy_to_remote "$TEMP_TAR" "$TEMP_TAR"

# 在服务器上解压
echo "在服务器上解压文件..."
run_remote "tar -xzf $TEMP_TAR -C $REMOTE_DIR --strip-components=1"
run_remote "rm $TEMP_TAR"

# 清理可能存在的临时文件
echo "清理临时文件..."
run_remote "find $REMOTE_DIR -name '.__*' -delete"
run_remote "find $REMOTE_DIR -name '._*' -delete"
run_remote "find $REMOTE_DIR -name '.DS_Store' -delete"
run_remote "find $REMOTE_DIR -name '*.swp' -delete"
run_remote "find $REMOTE_DIR -name '*.swo' -delete"
run_remote "find $REMOTE_DIR -name '*.bak' -delete"
run_remote "find $REMOTE_DIR -name '*.tmp' -delete"

# 清理本地临时文件
rm "$TEMP_TAR"

echo -e "${GREEN}✓ 文件复制完成${NC}"

# 步骤5: 配置生产环境
echo -e "\n${YELLOW}[5/6] 配置生产环境...${NC}"

# 检查是否有生产环境配置文件
if [ -f ".env.production" ]; then
    echo "使用现有的生产环境配置文件..."
    copy_to_remote ".env.production" "$REMOTE_DIR/.env"
else
    echo "生成生产环境配置..."
    # 生成强API密钥
    API_KEY=$(openssl rand -hex 32 2>/dev/null || echo "supabase-platform-secret-key-$(date +%s)")
    
    # 创建生产环境配置
    cat > /tmp/.env.production << EOF
# 生产环境配置 - 多租户Supabase平台
# 生成时间: $(date)

# API认证配置
API_AUTH_ENABLED=true
API_KEY=$API_KEY

# Traefik配置
TRAEFIK_DOMAIN=145.223.100.249
TRAEFIK_ACME_EMAIL=admin@example.com

# 服务端口配置
PLATFORM_BACKEND_PORT=3002
PLATFORM_DASHBOARD_PORT=3000
TRAEFIK_WEB_PORT=8085
TRAEFIK_ADMIN_PORT=8086
TRAEFIK_HTTPS_PORT=8444

# Docker配置
DOCKER_SOCKET=/var/run/docker.sock

# 安全配置
# 生产环境请修改以下默认值
# JWT_SECRET=$(openssl rand -hex 32)
# ANON_KEY=$(openssl rand -hex 32)
# SERVICE_KEY=$(openssl rand -hex 32)
EOF
    
    copy_to_remote "/tmp/.env.production" "$REMOTE_DIR/.env"
    rm /tmp/.env.production
    
    echo -e "${GREEN}✓ 生产环境配置文件已生成${NC}"
    echo -e "${YELLOW}重要: 请编辑 $REMOTE_DIR/.env 文件配置您的域名和邮箱${NC}"
fi

# 步骤6: 启动服务
echo -e "\n${YELLOW}[6/6] 启动服务...${NC}"
echo "正在构建和启动Docker服务..."

# 停止并移除现有容器（如果存在）
run_remote "cd $REMOTE_DIR && docker compose -f docker-compose.platform.yml down || true"

# 构建并启动服务
run_remote "cd $REMOTE_DIR && docker compose -f docker-compose.platform.yml up --build -d"

echo -e "${GREEN}✓ 服务启动命令已执行${NC}"

# 等待服务启动
echo "等待服务启动..."
sleep 10

# 步骤7: 验证部署
echo -e "\n${YELLOW}[7/6] 验证部署...${NC}"
echo "检查容器状态..."
run_remote "cd $REMOTE_DIR && docker compose -f docker-compose.platform.yml ps"

echo -e "\n${GREEN}=== 部署完成 ===${NC}"
echo -e "服务器: $SERVER"
echo -e "安装目录: $REMOTE_DIR"
echo -e "\n访问地址:"
echo -e "  - 前端仪表板: http://${SERVER}:3000"
echo -e "  - 后端API: http://${SERVER}:3002"
echo -e "  - Traefik管理界面: http://${SERVER}:8086"
echo -e "  - HTTPS端点: https://${SERVER}:8444"
echo -e "\n下一步操作:"
echo -e "  1. 配置域名: 修改 $REMOTE_DIR/.env 中的 TRAEFIK_DOMAIN"
echo -e "  2. 配置HTTPS邮箱: 修改 $REMOTE_DIR/.env 中的 TRAEFIK_ACME_EMAIL"
echo -e "  3. 查看日志: ssh root@$SERVER 'cd $REMOTE_DIR && docker compose -f docker-compose.platform.yml logs -f'"
echo -e "  4. 重启服务: ssh root@$SERVER 'cd $REMOTE_DIR && docker compose -f docker-compose.platform.yml restart'"
echo -e "\n部署完成时间: $(date)"