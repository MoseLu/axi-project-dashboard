#!/bin/bash

echo "🔍 502 错误诊断脚本"
echo "===================="

echo ""
echo "1. 检查 PM2 进程状态:"
pm2 status dashboard-backend

echo ""
echo "2. 检查端口 8090 是否被占用:"
netstat -tlnp | grep :8090 || echo "端口 8090 未被占用"

echo ""
echo "3. 检查 PM2 日志 (最后 20 行):"
pm2 logs dashboard-backend --lines 20 || echo "无法获取 PM2 日志"

echo ""
echo "4. 检查应用目录是否存在:"
ls -la /srv/apps/axi-project-dashboard/ || echo "应用目录不存在"

echo ""
echo "5. 检查应用文件结构:"
if [ -d "/srv/apps/axi-project-dashboard" ]; then
    echo "后端文件:"
    ls -la /srv/apps/axi-project-dashboard/backend/ || echo "后端目录不存在"
    echo "package.json:"
    ls -la /srv/apps/axi-project-dashboard/package.json || echo "package.json 不存在"
    echo "ecosystem.config.js:"
    ls -la /srv/apps/axi-project-dashboard/ecosystem.config.js || echo "ecosystem.config.js 不存在"
fi

echo ""
echo "6. 尝试手动启动服务测试:"
if [ -d "/srv/apps/axi-project-dashboard" ]; then
    cd /srv/apps/axi-project-dashboard
    echo "当前目录: $(pwd)"
    echo "Node.js 版本: $(node --version)"
    echo "检查依赖是否已安装:"
    ls -la node_modules/ | head -5 || echo "node_modules 不存在"
fi

echo ""
echo "7. 检查数据库连接:"
mysql -h 127.0.0.1 -P 3306 -u root -p123456 -e "SHOW DATABASES;" 2>/dev/null | grep project_dashboard || echo "无法连接到 project_dashboard 数据库"

echo ""
echo "8. 检查系统资源:"
echo "内存使用:"
free -h
echo "磁盘使用:"
df -h | grep -E '/$|/srv'

echo ""
echo "📋 诊断完成"
echo "如果发现问题，请根据以上信息进行修复"
