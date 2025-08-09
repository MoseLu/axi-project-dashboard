#!/bin/bash

# 🔍 快速诊断 axi-project-dashboard 502错误
# 使用方法：chmod +x diagnose_502.sh && ./diagnose_502.sh

echo "🔍 开始诊断 axi-project-dashboard 502错误..."
echo "========================================================"

echo "📋 1. 检查后端服务状态"
echo "PM2进程:"
pm2 list | grep dashboard || echo "❌ 未找到dashboard相关进程"

echo ""
echo "端口8090监听状态:"
netstat -tlnp 2>/dev/null | grep :8090 || ss -tlnp 2>/dev/null | grep :8090 || echo "❌ 端口8090未被监听"

echo ""
echo "端口8091监听状态:"
netstat -tlnp 2>/dev/null | grep :8091 || ss -tlnp 2>/dev/null | grep :8091 || echo "❌ 端口8091未被监听"

echo ""
echo "📋 2. 测试本地服务连接"
echo "测试 localhost:8090/health:"
curl -s -w "状态码: %{http_code}, 响应时间: %{time_total}s\n" http://localhost:8090/health 2>/dev/null || echo "❌ 连接失败"

echo ""
echo "测试 127.0.0.1:8090/health:"
curl -s -w "状态码: %{http_code}, 响应时间: %{time_total}s\n" http://127.0.0.1:8090/health 2>/dev/null || echo "❌ 连接失败"

echo ""
echo "📋 3. 检查Nginx配置"
echo "检查project-dashboard相关配置:"
grep -n "project-dashboard" /etc/nginx/sites-available/redamancy.com.cn 2>/dev/null || echo "❌ 未找到project-dashboard配置"

echo ""
echo "检查代理配置:"
grep -A 5 "proxy_pass.*8090" /etc/nginx/sites-available/redamancy.com.cn 2>/dev/null || echo "❌ 未找到8090端口代理配置"

echo ""
echo "📋 4. 测试外部访问"
echo "测试 HTTPS API 健康检查:"
curl -s -w "状态码: %{http_code}, 响应时间: %{time_total}s\n" https://redamancy.com.cn/project-dashboard/api/health 2>/dev/null

echo ""
echo "获取详细响应头:"
curl -I https://redamancy.com.cn/project-dashboard/api/health 2>/dev/null

echo ""
echo "📋 5. 检查进程和日志"
echo "后端进程详情:"
pm2 describe dashboard-backend 2>/dev/null | grep -E "(status|restarts|uptime)" || echo "❌ 进程不存在或异常"

echo ""
echo "最近的错误日志 (最后5行):"
pm2 logs dashboard-backend --lines 5 --err 2>/dev/null || echo "❌ 无法获取错误日志"

echo ""
echo "最近的输出日志 (最后5行):"
pm2 logs dashboard-backend --lines 5 --out 2>/dev/null || echo "❌ 无法获取输出日志"

echo ""
echo "📋 6. 检查Nginx日志"
echo "Nginx错误日志 (最后5行):"
tail -5 /var/log/nginx/error.log 2>/dev/null || echo "❌ 无法读取Nginx错误日志"

echo ""
echo "Nginx访问日志中project-dashboard相关请求 (最后5行):"
grep "project-dashboard" /var/log/nginx/access.log 2>/dev/null | tail -5 || echo "❌ 未找到相关访问记录"

echo ""
echo "📋 7. 系统资源检查"
echo "内存使用:"
free -h

echo ""
echo "磁盘空间:"
df -h /srv /var/log | head -3

echo ""
echo "CPU负载:"
uptime

echo ""
echo "========================================================"
echo "🔍 诊断完成！"
echo ""
echo "常见502错误原因及解决方案："
echo "1. 后端服务未运行 → 执行 ./fix_502_error.sh"
echo "2. Nginx配置缺失 → 执行 ./fix_nginx_502.sh"  
echo "3. 端口冲突 → 检查其他服务占用8090端口"
echo "4. 防火墙阻断 → 检查iptables或firewall规则"
echo "5. 资源不足 → 检查内存、磁盘空间"
