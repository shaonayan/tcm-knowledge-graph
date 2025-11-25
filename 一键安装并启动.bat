@echo off
chcp 65001 >nul
echo ============================================
echo 3D 可视化依赖安装和启动脚本
echo ============================================
echo.

cd /d "%~dp0frontend"

if not exist "package.json" (
    echo [错误] 未找到 package.json 文件！
    pause
    exit /b 1
)

echo 步骤 1/2: 检查依赖是否已安装...
echo.

if exist "node_modules\three" (
    echo ✅ three 已安装
) else (
    echo ⚠️  three 未安装，开始安装...
    call npm install three @react-three/fiber @react-three/drei
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [错误] 依赖安装失败！
        pause
        exit /b 1
    )
)

if exist "node_modules\@react-three\fiber" (
    echo ✅ @react-three/fiber 已安装
) else (
    echo ⚠️  @react-three/fiber 未安装，开始安装...
    call npm install three @react-three/fiber @react-three/drei
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [错误] 依赖安装失败！
        pause
        exit /b 1
    )
)

echo.
echo ============================================
echo ✅ 所有依赖已就绪！
echo ============================================
echo.
echo 步骤 2/2: 启动前端开发服务器...
echo.
echo 服务器启动后，访问：
echo http://localhost:3000/visualizations
echo.
echo 按 Ctrl+C 可以停止服务器
echo ============================================
echo.

call npm run dev

pause
