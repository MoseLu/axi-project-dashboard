#!/bin/bash

echo "🔍 调试端口监听情况..."

echo "📋 检查所有端口监听:"
netstat -tlnp 2>/dev/null | grep -E ":(80|443|8080|8090|3000)"

echo ""
echo "📋 检查8090端口进程:"
netstat -tlnp 2>/dev/null | grep ":8090" || echo "❌ 8090端口无进程监听"

echo ""
echo "📋 检查8080端口进程:"
netstat -tlnp 2>/dev/null | grep ":8080" || echo "❌ 8080端口无进程监听"

echo ""
echo "📋 检查3000端口进程:"
netstat -tlnp 2>/dev/null | grep ":3000" || echo "❌ 3000端口无进程监听"

echo ""
echo "📋 PM2进程状态:"
pm2 list

echo ""
echo "📋 测试本地8090端口:"
curl -f http://localhost:8090/health 2>/dev/null && echo "✅ 8090端口响应正常" || echo "❌ 8090端口无响应"

echo ""
echo "📋 测试本地8080端口:"
curl -f http://localhost:8080/health 2>/dev/null && echo "✅ 8080端口响应正常" || echo "❌ 8080端口无响应"

echo ""
echo "📋 测试本地3000端口:"
curl -f http://localhost:3000/health 2>/dev/null && echo "✅ 3000端口响应正常" || echo "❌ 3000端口无响应"

echo ""
echo "📋 检查Nginx配置中的端口:"
grep -r "proxy_pass.*127.0.0.1" /www/server/nginx/conf/conf.d/redamancy/ 2>/dev/null || echo "❌ 未找到Nginx代理配置"

echo ""
echo "🔍 调试完成"
