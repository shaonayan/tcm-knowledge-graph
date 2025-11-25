@echo off
chcp 65001 >nul
echo ====================================
echo 启动中医知识图谱前端开发服务器
echo ====================================
echo.

cd /d "%~dp0frontend"

REM 检查端口是否被占用
netstat -ano | findstr :3000 >nul
if not errorlevel 1 (
    echo ⚠️  端口3000已被占用
    echo 正在关闭占用端口的进程...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
        taskkill /PID %%a /F >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
)

echo 正在启动前端开发服务器...
echo 访问地址: http://localhost:3000
echo 按 Ctrl+C 停止服务器
echo.

call npm.cmd run dev

pause

