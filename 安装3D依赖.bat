@echo off
chcp 65001 >nul
echo ============================================
echo 安装 3D 可视化依赖
echo ============================================
echo.

cd /d "%~dp0frontend"

echo 当前目录: %CD%
echo.
echo 正在安装依赖...
echo - three
echo - @react-three/fiber
echo - @react-three/drei
echo.

call npm install three @react-three/fiber @react-three/drei

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo ✅ 安装成功！
    echo ============================================
    echo.
    echo 请重启前端服务器：
    echo   npm run dev
    echo.
    echo 然后访问：http://localhost:3000/visualizations
    echo.
) else (
    echo.
    echo ============================================
    echo ❌ 安装失败！
    echo ============================================
    echo.
    echo 可能的原因：
    echo 1. 未安装 Node.js
    echo 2. 网络连接问题
    echo 3. 权限不足
    echo.
    echo 请检查错误信息后重试。
    echo.
)

pause