#!/bin/bash

# 🔍 axi-project-dashboard 502错误快速诊断脚本
# 使用方法：chmod +x debug_502.sh && ./debug_502.sh

echo "🔍 开始诊断 axi-project-dashboard 502错误..."
echo "========================================================"

# 1. 基本信息
echo "📋 1. 基本环境信息"
echo "当前用户: $(whoami)"
echo "当前目录: $(pwd)"
echo "当前时间: $(date)"
echo ""

# 2. 检查项目目录
echo "📋 2. 项目目录检查"
cd /srv/apps/axi-project-dashboard 2>/dev/null || {
    echo "❌ 无法进入项目目录 /srv/apps/axi-project-dashboard"
    echo "请检查目录是否存在"
    exit 1
}

echo "✅ 成功进入项目目录"
echo "目录内容："
ls -la
echo ""

# 3. 检查关键文件
echo "📋 3. 关键文件检查"
files_to_check=(
    "backend/start-server.js"
    "backend/index.js"
    "ecosystem.config.js"
    "package.json"
    "node_modules"
)

for file in "${files_to_check[@]}"; do
    if [ -e "$file" ]; then
        echo "✅ $file 存在"
    else
        echo "❌ $file 不存在"
    fi
done
echo ""

# 4. 检查Node.js环境
echo "📋 4. Node.js环境检查"
if command -v node &> /dev/null; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js 未安装"
fi

if command -v npm &> /dev/null; then
    echo "✅ npm: $(npm --version)"
else
    echo "❌ npm 未安装"
fi

if command -v pm2 &> /dev/null; then
    echo "✅ PM2: $(pm2 --version)"
else
    echo "❌ PM2 未安装"
fi
echo ""

# 5. 检查start-server.js内容
echo "📋 5. start-server.js 内容检查"
if [ -f "backend/start-server.js" ]; then
    echo "文件权限: $(ls -la backend/start-server.js)"
    echo "文件内容 (前10行):"
    head -10 backend/start-server.js
else
    echo "❌ start-server.js 文件不存在"
fi
echo ""

# 6. PM2进程检查
echo "📋 6. PM2进程状态检查"
if command -v pm2 &> /dev/null; then
    echo "PM2进程列表:"
    pm2 list
    echo ""
    
    echo "dashboard-backend进程详情:"
    pm2 describe dashboard-backend 2>/dev/null || echo "❌ dashboard-backend进程不存在"
    echo ""
    
    echo "PM2日志 (最后20行):"
    pm2 logs dashboard-backend --lines 20 2>/dev/null || echo "❌ 无法获取PM2日志"
else
    echo "❌ PM2 未安装，无法检查进程状态"
fi
echo ""

# 7. 端口检查
echo "📋 7. 端口8090占用检查"
port_check=$(netstat -tlnp 2>/dev/null | grep :8090 || ss -tlnp 2>/dev/null | grep :8090)
if [ -n "$port_check" ]; then
    echo "✅ 端口8090被占用:"
    echo "$port_check"
else
    echo "❌ 端口8090未被占用"
fi
echo ""

# 8. 健康检查测试
echo "📋 8. 本地健康检查测试"
echo "测试 http://localhost:8090/health :"
health_result=$(curl -s -w "HTTP状态码: %{http_code}\n" http://localhost:8090/health 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ 连接成功"
    echo "$health_result"
else
    echo "❌ 连接失败"
fi
echo ""

echo "测试 http://127.0.0.1:8090/health :"
health_result2=$(curl -s -w "HTTP状态码: %{http_code}\n" http://127.0.0.1:8090/health 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ 连接成功"
    echo "$health_result2"
else
    echo "❌ 连接失败"
fi
echo ""

# 9. 数据库连接检查
echo "📋 9. 数据库连接检查"
if command -v mysql &> /dev/null; then
    echo "测试MySQL连接..."
    mysql -h 127.0.0.1 -P 3306 -u root -p123456 -e "SELECT 1;" 2>/dev/null && echo "✅ MySQL连接成功" || echo "❌ MySQL连接失败"
else
    echo "❌ MySQL客户端未安装"
fi

if command -v redis-cli &> /dev/null; then
    echo "测试Redis连接..."
    redis-cli ping 2>/dev/null && echo "✅ Redis连接成功" || echo "❌ Redis连接失败"
else
    echo "❌ Redis客户端未安装"
fi
echo ""

# 10. Nginx配置检查
echo "📋 10. Nginx配置检查"
if command -v nginx &> /dev/null; then
    echo "Nginx配置测试:"
    nginx -t 2>&1
    echo ""
    
    echo "Nginx状态:"
    systemctl status nginx --no-pager -l 2>/dev/null || service nginx status 2>/dev/null || echo "无法获取Nginx状态"
    echo ""
    
    echo "Nginx错误日志 (最后10行):"
    tail -10 /var/log/nginx/error.log 2>/dev/null || echo "无法读取Nginx错误日志"
else
    echo "❌ Nginx 未安装或不在PATH中"
fi
echo ""

# 11. 进程检查
echo "📋 11. 相关进程检查"
echo "Node.js相关进程:"
ps aux | grep node | grep -v grep || echo "未找到Node.js进程"
echo ""

echo "PM2相关进程:"
ps aux | grep pm2 | grep -v grep || echo "未找到PM2进程"
echo ""

# 12. 系统资源检查
echo "📋 12. 系统资源检查"
echo "内存使用:"
free -h
echo ""

echo "磁盘使用:"
df -h /srv
echo ""

# 总结
echo "========================================================"
echo "🔍 诊断完成！"
echo ""
echo "📋 请检查以上输出中的❌标记项目"
echo "📋 特别关注："
echo "   - PM2进程是否正常运行"
echo "   - 端口8090是否被正确占用"
echo "   - start-server.js文件是否存在且有正确内容"
echo "   - Node.js应用是否成功启动"
echo ""
echo "如需手动启动应用进行测试，请执行："
echo "cd /srv/apps/axi-project-dashboard && node backend/start-server.js"
echo ""
echo "如需重新启动PM2，请执行："
echo "pm2 restart ecosystem.config.js --update-env"
