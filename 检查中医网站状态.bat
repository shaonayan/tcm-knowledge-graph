@echo off
chcp 65001 >nul
echo ====================================
echo 检查中医知识图谱网站状态
echo ====================================
echo.

echo [检查1] 检查端口3001是否被占用...
netstat -ano | findstr :3001 >nul
if errorlevel 1 (
    echo ❌ 端口3001未被占用，后端服务未启动
    echo.
    echo 请运行"启动生产服务器.bat"启动后端服务
) else (
    echo ✅ 端口3001已被占用，后端服务可能正在运行
    echo.
    echo 正在测试健康检查接口...
    curl -s http://localhost:3001/health >nul
    if errorlevel 1 (
        echo ❌ 无法连接到后端服务
    ) else (
        echo ✅ 后端服务运行正常
    )
)

echo.
echo [检查2] 检查端口3000是否被占用（前端开发服务器）...
netstat -ano | findstr :3000 >nul
if errorlevel 1 (
    echo ❌ 端口3000未被占用，前端开发服务器未启动
) else (
    echo ✅ 端口3000已被占用，前端开发服务器可能正在运行
)

echo.
echo ====================================
echo 访问地址：
echo ====================================
echo 生产模式: http://localhost:3001
echo 开发模式: http://localhost:3000
echo.
echo 如果无法访问，请：
echo 1. 运行"启动生产服务器.bat"启动后端（端口3001）
echo 2. 运行"启动前端开发服务器.bat"启动前端（端口3000）
echo 3. 或运行"同时启动前后端.bat"一键启动所有服务
echo.

pause

