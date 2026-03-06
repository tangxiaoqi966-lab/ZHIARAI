#!/bin/bash

set -e

echo "🚀 开始部署 Supabase 平台管理后台"

# 检查环境变量
if [ -f .env ]; then
    echo "📝 加载环境变量文件"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️  未找到 .env 文件，使用默认值"
fi

# 检查Docker和Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 创建必要的目录
echo "📁 创建目录结构"
mkdir -p nginx
mkdir -p data/postgres

# 创建nginx配置文件（如果不存在）
if [ ! -f nginx/proxy.conf ]; then
    echo "📝 创建nginx配置文件"
    cat > nginx/proxy.conf << 'EOF'
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api {
        proxy_pass http://backend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF
fi

# 检查是否在开发模式
if [ "$1" = "dev" ]; then
    echo "🔧 开发模式部署"
    docker-compose -f docker-compose.dev.yml up --build -d
elif [ "$1" = "prod" ]; then
    echo "🏭 生产模式部署"
    docker-compose -f docker-compose.prod.yml up --build -d
else
    echo "📦 标准部署"
    docker-compose up --build -d
fi

echo ""
echo "✅ 部署完成！"
echo ""
echo "📊 服务状态："
docker-compose ps
echo ""
echo "🌐 访问地址："
echo "   前端管理界面：http://localhost"
echo "   后端API：http://localhost:3001"
echo "   健康检查：http://localhost:3001/api/health"
echo ""
echo "🔑 默认管理员账户："
echo "   用户名：admin"
echo "   密码：admin123"
echo ""
echo "⚠️  注意：首次使用请立即修改默认密码！"
echo ""
echo "📋 查看日志："
echo "   docker-compose logs -f"
echo ""
echo "🛑 停止服务："
echo "   docker-compose down"