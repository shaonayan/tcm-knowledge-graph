@echo off
chcp 65001 >nul
echo ====================================
echo 同时启动中医知识图谱前后端服务
echo ====================================
echo.

REM 关闭可能占用的端口
echo [步骤1] 清理端口...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 2 /nobreak >nul

echo.
echo [步骤2] 启动后端服务（端口3001）...
start "中医网站-后端" cmd /k "cd /d %~dp0backend && set NODE_ENV=production && node server-simple.js"

timeout /t 3 /nobreak >nul

echo.
echo [步骤3] 启动前端开发服务器（端口3000）...
start "中医网站-前端" cmd /k "cd /d %~dp0frontend && npm.cmd run dev"

echo.
echo ====================================
echo ✅ 服务启动完成！
echo ====================================
echo.
echo 后端服务: http://localhost:3001
echo 前端服务: http://localhost:3000
echo.
echo 两个窗口已打开，请等待服务启动完成
echo 关闭窗口即可停止对应的服务
echo.
pause

