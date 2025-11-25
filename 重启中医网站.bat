@echo off
chcp 65001 >nul
echo ====================================
echo 重启中医知识图谱网站
echo ====================================
echo.

echo [步骤1] 关闭占用端口3001的进程...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    echo 找到进程ID: %%a，正在结束...
    taskkill /PID %%a /F >nul 2>&1
    if errorlevel 1 (
        echo ⚠️  无法结束进程 %%a
    ) else (
        echo ✅ 进程 %%a 已结束
    )
)

echo.
echo 等待2秒确保端口释放...
timeout /t 2 /nobreak >nul

echo.
echo [步骤2] 启动后端服务...
cd /d "%~dp0backend"
echo 当前目录: %CD%
echo.

REM 检查是否有server-simple.js（启动脚本使用的文件）
if exist "server-simple.js" (
    echo 使用server-simple.js启动...
    set NODE_ENV=production
    node server-simple.js
) else if exist "server-production.js" (
    echo 使用server-production.js启动...
    set NODE_ENV=production
    node server-production.js
) else (
    echo ❌ 未找到服务器文件
    echo 请检查backend目录
    pause
    exit /b 1
)

