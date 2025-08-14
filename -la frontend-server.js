[33m0cb607b[m[33m ([m[1;36mHEAD[m[33m -> [m[1;32mmain[m[33m, [m[1;31morigin/main[m[33m, [m[1;31morigin/HEAD[m[33m)[m fix: 修复 axi-project-dashboard 部署失败问题
[33m00997de[m 完全绕过 PM2：直接使用 Node.js 启动后端服务，避免 PM2 相关问题
[33mc8ef1bb[m 增强启动脚本：添加内置 PM2 清理逻辑，不依赖外部文件
[33maad3328[m 添加 PM2 清理脚本：彻底清理可能残留的前端服务配置
[33mc3168ee[m 增强调试：添加更详细的启动过程日志，帮助定位 frontend-server.js 错误来源
