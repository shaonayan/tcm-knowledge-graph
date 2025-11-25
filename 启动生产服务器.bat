@echo off
chcp 65001 >nul
echo ====================================
echo 启动中医知识图谱生产服务器
echo ====================================
echo.

cd /d "%~dp0backend"

REM 检查端口是否被占用
netstat -ano | findstr :3001 >nul
if not errorlevel 1 (
    echo ⚠️  端口3001已被占用
    echo 正在关闭占用端口的进程...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
        taskkill /PID %%a /F >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
)

REM .env文件不是必需的（server-simple.js有默认配置）
REM if not exist ".env" (
REM     echo ⚠️  未找到.env文件，将使用默认配置
REM )

echo 正在启动服务器...
echo 访问地址: http://localhost:3001
echo 健康检查: http://localhost:3001/health
echo 按 Ctrl+C 停止服务器
echo.

set NODE_ENV=production
node server-simple.js

pause

