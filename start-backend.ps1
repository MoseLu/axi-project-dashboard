# axi-project-dashboard 后端启动脚本
# 使用方法: .\start-backend.ps1

Write-Host "🚀 启动 axi-project-dashboard 后端服务..." -ForegroundColor Green

# 检查是否在正确的目录
if (-not (Test-Path "backend")) {
    Write-Host "❌ 错误: 请在 axi-project-dashboard 根目录下运行此脚本" -ForegroundColor Red
    exit 1
}

# 切换到后端目录
Set-Location backend

# 检查依赖是否安装
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 安装依赖..." -ForegroundColor Yellow
    pnpm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 依赖安装失败" -ForegroundColor Red
        exit 1
    }
}

# 检查端口是否被占用
$port = 8081
$process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($process) {
    Write-Host "⚠️  警告: 端口 $port 已被占用" -ForegroundColor Yellow
    Write-Host "正在终止占用端口的进程..." -ForegroundColor Yellow
    Stop-Process -Id $process.OwningProcess -Force
    Start-Sleep 2
}

# 启动开发服务器
Write-Host "🔧 启动开发服务器 (端口: $port)..." -ForegroundColor Green
Write-Host "📝 日志将显示在下方，按 Ctrl+C 停止服务" -ForegroundColor Cyan
Write-Host "🌐 服务地址: http://localhost:$port" -ForegroundColor Cyan
Write-Host "🔌 WebSocket地址: ws://localhost:$port/project-dashboard/ws" -ForegroundColor Cyan
Write-Host ""

try {
    pnpm run dev:fast
} catch {
    Write-Host "❌ 启动失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
