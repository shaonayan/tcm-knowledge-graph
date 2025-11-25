@echo off
chcp 65001 >nul
echo ====================================
echo 检查 Node.js 和 npm 安装
echo ====================================
echo.

echo [1] 检查 Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo ❌ 未找到 Node.js
    echo.
    echo 正在搜索常见安装位置...
    echo.
    
    if exist "C:\Program Files\nodejs\node.exe" (
        echo ✅ 找到 Node.js: C:\Program Files\nodejs
        set "NODE_PATH=C:\Program Files\nodejs"
    ) else if exist "C:\Program Files (x86)\nodejs\node.exe" (
        echo ✅ 找到 Node.js: C:\Program Files (x86)\nodejs
        set "NODE_PATH=C:\Program Files (x86)\nodejs"
    ) else (
        echo ❌ 未在常见位置找到 Node.js
        echo.
        echo 请检查：
        echo 1. Node.js 是否已安装
        echo 2. 安装路径是否正确
        echo.
        pause
        exit /b 1
    )
) else (
    echo ✅ Node.js 已在 PATH 中
    node --version
)

echo.
echo [2] 检查 npm...
where npm >nul 2>&1
if errorlevel 1 (
    echo ❌ 未找到 npm
    if defined NODE_PATH (
        echo.
        echo 尝试使用找到的 Node.js 路径...
        "%NODE_PATH%\npm.cmd" --version
        if errorlevel 1 (
            echo ❌ npm 不可用
        ) else (
            echo ✅ npm 可用（但不在 PATH 中）
            echo.
            echo 建议：将 Node.js 添加到系统 PATH
            echo 路径：%NODE_PATH%
        )
    )
) else (
    echo ✅ npm 已在 PATH 中
    npm --version
)

echo.
echo ====================================
echo 检查完成
echo ====================================
echo.
echo 如果 Node.js 和 npm 都可用，您可以：
echo 1. 直接运行"执行部署.bat"
echo 2. 或手动添加到系统 PATH（见"修复npm路径问题.md"）
echo.
pause

