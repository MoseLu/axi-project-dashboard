#!/bin/bash

# 🔧 修复 axi-project-dashboard Nginx 502错误
# 使用方法：chmod +x fix_nginx_502.sh && ./fix_nginx_502.sh

echo "🔧 开始修复 axi-project-dashboard Nginx 502错误..."
echo "========================================================"

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then 
    echo "❌ 请使用root用户运行此脚本"
    exit 1
fi

echo "📋 1. 检查Nginx配置文件"
NGINX_CONF="/etc/nginx/sites-available/redamancy.com.cn"
NGINX_ENABLED="/etc/nginx/sites-enabled/redamancy.com.cn"

if [ ! -f "$NGINX_CONF" ]; then
    echo "❌ Nginx配置文件不存在: $NGINX_CONF"
    exit 1
fi

echo "✅ Nginx配置文件存在"

echo ""
echo "📋 2. 检查当前project-dashboard配置"
if grep -q "location /project-dashboard" "$NGINX_CONF"; then
    echo "✅ 发现现有的project-dashboard配置"
    echo "当前配置:"
    grep -A 10 "location /project-dashboard" "$NGINX_CONF"
else
    echo "❌ 未找到project-dashboard配置"
fi

echo ""
echo "📋 3. 备份当前Nginx配置"
cp "$NGINX_CONF" "${NGINX_CONF}.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ 配置已备份到: ${NGINX_CONF}.backup.$(date +%Y%m%d_%H%M%S)"

echo ""
echo "📋 4. 检查后端服务状态"
echo "PM2进程状态:"
pm2 list | grep dashboard-backend
echo ""

echo "端口8090占用情况:"
netstat -tlnp | grep :8090 || ss -tlnp | grep :8090
echo ""

echo "测试本地后端服务:"
curl -s -w "状态码: %{http_code}\n" http://localhost:8090/health || echo "❌ 本地后端服务不可访问"

echo ""
echo "📋 5. 添加/更新project-dashboard配置"

# 生成正确的nginx配置块
cat > /tmp/project_dashboard_nginx.conf << 'EOF'

# axi-project-dashboard 配置
location /project-dashboard {
    alias /srv/apps/axi-project-dashboard/frontend;
    try_files $uri $uri/ /project-dashboard/index.html;
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}

location /project-dashboard/api/ {
    rewrite ^/project-dashboard/api/(.*) /api/$1 break;
    proxy_pass http://127.0.0.1:8090;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Prefix /project-dashboard;
    
    # API 特定配置
    proxy_connect_timeout 30s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
    proxy_buffering off;
}

location /project-dashboard/ws/ {
    rewrite ^/project-dashboard/ws/(.*) /socket.io/$1 break;
    proxy_pass http://127.0.0.1:8091;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

location /project-dashboard/webhook/github {
    rewrite ^/project-dashboard/webhook/github(.*) /api/webhook/github$1 break;
    proxy_pass http://127.0.0.1:8090;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
EOF

# 删除现有的project-dashboard配置
sed -i '/# axi-project-dashboard 配置/,/^}$/d' "$NGINX_CONF"
sed -i '/location \/project-dashboard/,/^[[:space:]]*}[[:space:]]*$/d' "$NGINX_CONF"

# 在server块结束前添加新配置
sed -i '/^[[:space:]]*}[[:space:]]*$/i\
' "$NGINX_CONF"

# 在最后一个server块的}前插入配置
awk '
    /^[[:space:]]*server[[:space:]]*{/ { in_server = 1 }
    in_server && /^[[:space:]]*}[[:space:]]*$/ && !inserted {
        while ((getline line < "/tmp/project_dashboard_nginx.conf") > 0) {
            print line
        }
        close("/tmp/project_dashboard_nginx.conf")
        inserted = 1
    }
    { print }
' "$NGINX_CONF" > /tmp/nginx_updated.conf

mv /tmp/nginx_updated.conf "$NGINX_CONF"
rm -f /tmp/project_dashboard_nginx.conf

echo "✅ project-dashboard配置已添加"

echo ""
echo "📋 6. 测试Nginx配置"
nginx -t
if [ $? -eq 0 ]; then
    echo "✅ Nginx配置语法正确"
else
    echo "❌ Nginx配置语法错误，恢复备份"
    cp "${NGINX_CONF}.backup.$(date +%Y%m%d_%H%M%S)" "$NGINX_CONF"
    exit 1
fi

echo ""
echo "📋 7. 重新加载Nginx"
systemctl reload nginx
if [ $? -eq 0 ]; then
    echo "✅ Nginx重新加载成功"
else
    echo "❌ Nginx重新加载失败"
    systemctl status nginx
    exit 1
fi

echo ""
echo "📋 8. 验证配置"
sleep 2

echo "测试后端API健康检查:"
curl -s -w "状态码: %{http_code}\n" https://redamancy.com.cn/project-dashboard/api/health

echo ""
echo "测试前端页面:"
curl -s -w "状态码: %{http_code}\n" https://redamancy.com.cn/project-dashboard/ | head -1

echo ""
echo "========================================================"
echo "🎉 修复完成！"
echo ""
echo "如果仍有问题，请检查："
echo "1. 后端服务是否正常运行: pm2 logs dashboard-backend"
echo "2. 端口8090是否正确监听: netstat -tlnp | grep :8090"
echo "3. 防火墙是否允许内部访问"
echo "4. Nginx错误日志: tail -f /var/log/nginx/error.log"
