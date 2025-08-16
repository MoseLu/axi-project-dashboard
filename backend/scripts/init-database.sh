#!/bin/bash

set -e

echo "🔧 开始初始化 axi-project-dashboard 数据库（模仿 axi-star-cloud 策略）..."

# 设置数据库配置
DB_HOST="127.0.0.1"
DB_PORT="3306"
DB_USER="root"
DB_PASSWORD="123456"
DB_NAME="project_dashboard"

echo "📋 数据库配置:"
echo "- 主机: $DB_HOST"
echo "- 端口: $DB_PORT"
echo "- 用户: $DB_USER"
echo "- 数据库: $DB_NAME"

# 检查 MySQL 是否运行
echo "🔍 检查 MySQL 服务状态..."
if ! systemctl is-active --quiet mysql; then
    echo "❌ MySQL 服务未运行，尝试启动..."
    sudo systemctl start mysql
    sleep 3
fi

if systemctl is-active --quiet mysql; then
    echo "✅ MySQL 服务运行正常"
else
    echo "❌ MySQL 服务启动失败"
    exit 1
fi

# 连接到 MySQL 并创建数据库（如果不存在）
echo "🔧 检查并创建数据库..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
" 2>/dev/null || {
    echo "❌ 数据库创建失败，尝试使用默认连接..."
    mysql -u"$DB_USER" -p"$DB_PASSWORD" -e "
CREATE DATABASE IF NOT EXISTS \`$DB_NAME\` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
" || {
        echo "❌ 数据库创建失败"
        exit 1
    }
}

echo "✅ 数据库 $DB_NAME 已准备就绪"

# 检查 Node.js 环境
echo "🔍 检查 Node.js 环境..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装"
    exit 1
fi

echo "✅ Node.js 环境检查通过"

# 检查项目目录
echo "🔍 检查项目目录..."
if [ ! -f "package.json" ]; then
    echo "❌ 请在 backend 目录中运行此脚本"
    exit 1
fi

echo "✅ 项目目录检查通过"

# 安装依赖（如果需要）
echo "📦 检查并安装依赖..."
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    if command -v pnpm &> /dev/null; then
        pnpm install
    else
        npm install
    fi
else
    echo "✅ 依赖已安装"
fi

# 设置环境变量
export MYSQL_HOST="$DB_HOST"
export MYSQL_PORT="$DB_PORT"
export MYSQL_USER="$DB_USER"
export MYSQL_PASSWORD="$DB_PASSWORD"
export MYSQL_DATABASE="$DB_NAME"
export NODE_ENV="production"

echo "📋 环境变量设置:"
echo "- MYSQL_HOST: $MYSQL_HOST"
echo "- MYSQL_PORT: $MYSQL_PORT"
echo "- MYSQL_USER: $MYSQL_USER"
echo "- MYSQL_DATABASE: $MYSQL_DATABASE"
echo "- NODE_ENV: $NODE_ENV"

# 运行数据库初始化程序
echo "🔧 运行数据库初始化程序..."

# 检查 TypeScript 文件是否存在
if [ -f "src/scripts/init-database.ts" ]; then
    echo "✅ 找到 TypeScript 初始化脚本"
    
    # 尝试使用 TypeScript 版本
    if command -v pnpm &> /dev/null; then
        echo "🔧 使用 pnpm 运行 TypeScript 初始化脚本..."
        pnpm run db:init 2>&1 || {
            echo "⚠️ TypeScript 版本失败，尝试使用 JavaScript 版本..."
            if [ -f "src/scripts/init-database.js" ]; then
                node src/scripts/init-database.js
            else
                echo "❌ 数据库初始化失败"
                exit 1
            fi
        }
    else
        echo "🔧 使用 npm 运行 TypeScript 初始化脚本..."
        npm run db:init 2>&1 || {
            echo "⚠️ TypeScript 版本失败，尝试使用 JavaScript 版本..."
            if [ -f "src/scripts/init-database.js" ]; then
                node src/scripts/init-database.js
            else
                echo "❌ 数据库初始化失败"
                exit 1
            fi
        }
    fi
else
    echo "❌ TypeScript 初始化脚本不存在"
    exit 1
fi

# 验证数据库表
echo "🔍 验证数据库表..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
SHOW TABLES;
" 2>/dev/null || mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "
SHOW TABLES;
" || {
    echo "❌ 无法连接到数据库进行验证"
    exit 1
}

# 显示数据库状态
echo "📊 显示数据库状态..."
if command -v pnpm &> /dev/null; then
    pnpm run db:status 2>/dev/null || npm run db:status 2>/dev/null || {
        echo "⚠️ 无法获取数据库状态"
    }
else
    npm run db:status 2>/dev/null || {
        echo "⚠️ 无法获取数据库状态"
    }
fi

echo "✅ 数据库初始化验证完成"
echo "🎉 axi-project-dashboard 数据库初始化成功！"
echo "💡 初始化策略：表不存在则创建，已存在则跳过，保持数据完整性"

# 显示使用说明
echo ""
echo "📋 后续操作说明:"
echo "1. 启动服务: npm start 或 pnpm start"
echo "2. 查看数据库状态: npm run db:status 或 pnpm run db:status"
echo "3. 清理测试数据: npm run db:cleanup-test 或 pnpm run db:cleanup-test"
echo "4. 重置部署数据: npm run db:reset-deployments 或 pnpm run db:reset-deployments"
echo "5. 完全重置数据库: npm run db:reset 或 pnpm run db:reset"
echo ""
echo "🔐 默认管理员账户:"
echo "   用户名: admin"
echo "   密码: admin123"
echo "   邮箱: admin@axi.com"
