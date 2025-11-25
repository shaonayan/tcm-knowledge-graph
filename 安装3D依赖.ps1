# PowerShell 安装脚本
# 编码：UTF-8

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "安装 3D 可视化依赖" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 获取脚本所在目录
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 进入 frontend 目录
$frontendDir = Join-Path $scriptDir "frontend"

if (-not (Test-Path $frontendDir)) {
    Write-Host "❌ 错误：找不到 frontend 目录" -ForegroundColor Red
    Write-Host "脚本目录: $scriptDir" -ForegroundColor Yellow
    pause
    exit 1
}

Set-Location $frontendDir
Write-Host "当前目录: $(Get-Location)" -ForegroundColor Green
Write-Host ""

# 检查 package.json 是否存在
if (-not (Test-Path "package.json")) {
    Write-Host "❌ 错误：找不到 package.json" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "正在安装依赖..." -ForegroundColor Yellow
Write-Host "- three" -ForegroundColor Gray
Write-Host "- @react-three/fiber" -ForegroundColor Gray
Write-Host "- @react-three/drei" -ForegroundColor Gray
Write-Host ""

# 安装依赖
try {
    npm install three @react-three/fiber @react-three/drei
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "============================================" -ForegroundColor Green
        Write-Host "✅ 安装成功！" -ForegroundColor Green
        Write-Host "============================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "请重启前端服务器：" -ForegroundColor Yellow
        Write-Host "  npm run dev" -ForegroundColor White
        Write-Host ""
        Write-Host "然后访问：http://localhost:3000/visualizations" -ForegroundColor Cyan
        Write-Host ""
    } else {
        throw "npm install 返回错误码: $LASTEXITCODE"
    }
} catch {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Red
    Write-Host "❌ 安装失败！" -ForegroundColor Red
    Write-Host "============================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "错误信息: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "可能的原因：" -ForegroundColor Yellow
    Write-Host "1. 未安装 Node.js" -ForegroundColor Gray
    Write-Host "2. 网络连接问题" -ForegroundColor Gray
    Write-Host "3. 权限不足（请右键以管理员身份运行）" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "按任意键退出..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
