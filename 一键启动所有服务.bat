@echo off
chcp 65001 >nul
echo ====================================
echo 启动中医知识图谱网站服务
echo ====================================
echo.

echo [步骤1] 检查并清理端口...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do taskkill /PID %%a /F >nul 2>&1
timeout /t 1 /nobreak >nul

echo [步骤2] 启动后端服务（端口3001）...
cd /d "%~dp0backend"
start "中医后端-3001" cmd /k "cd /d %~dp0backend && set NODE_ENV=production && node server-simple.js"

timeout /t 2 /nobreak >nul

echo [步骤3] 启动前端服务（端口3000）...
cd /d "%~dp0frontend"
start "中医前端-3000" cmd /k "cd /d %~dp0frontend && npm.cmd run dev"

echo.
echo ====================================
echo ✅ 中医网站服务启动完成
echo ====================================
echo.
echo 后端服务: http://localhost:3001
echo 前端服务: http://localhost:3000
echo 生产模式: http://localhost:3001
echo.
echo 两个窗口已打开，请等待服务启动完成
echo.
pause

