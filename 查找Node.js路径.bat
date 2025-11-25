@echo off
chcp 65001 >nul
echo ====================================
echo 查找 Node.js 安装路径
echo ====================================
echo.

echo [方法1] 检查 PATH 环境变量中的 Node.js...
where node >nul 2>&1
if not errorlevel 1 (
    echo ✅ 在 PATH 中找到 Node.js：
    where node
    echo.
) else (
    echo ❌ PATH 中未找到 Node.js
    echo.
)

echo [方法2] 检查常见安装位置...
echo.

set "FOUND=0"

if exist "C:\Program Files\nodejs\node.exe" (
    echo ✅ 找到：C:\Program Files\nodejs
    echo    完整路径：C:\Program Files\nodejs\node.exe
    set "NODE_PATH=C:\Program Files\nodejs"
    set "FOUND=1"
)

if exist "C:\Program Files (x86)\nodejs\node.exe" (
    echo ✅ 找到：C:\Program Files (x86)\nodejs
    echo    完整路径：C:\Program Files (x86)\nodejs\node.exe
    set "NODE_PATH=C:\Program Files (x86)\nodejs"
    set "FOUND=1"
)

if exist "%APPDATA%\npm\node.exe" (
    echo ✅ 找到：%APPDATA%\npm
    echo    完整路径：%APPDATA%\npm\node.exe
    set "FOUND=1"
)

if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" (
    echo ✅ 找到：%LOCALAPPDATA%\Programs\nodejs
    echo    完整路径：%LOCALAPPDATA%\Programs\nodejs\node.exe
    set "NODE_PATH=%LOCALAPPDATA%\Programs\nodejs"
    set "FOUND=1"
)

if exist "%USERPROFILE%\AppData\Local\Programs\nodejs\node.exe" (
    echo ✅ 找到：%USERPROFILE%\AppData\Local\Programs\nodejs
    echo    完整路径：%USERPROFILE%\AppData\Local\Programs\nodejs\node.exe
    set "NODE_PATH=%USERPROFILE%\AppData\Local\Programs\nodejs"
    set "FOUND=1"
)

echo.
if "%FOUND%"=="0" (
    echo ❌ 未在常见位置找到 Node.js
    echo.
    echo 可能的原因：
    echo 1. Node.js 未安装
    echo 2. 安装在非标准位置
    echo.
    echo 建议：
    echo 1. 检查是否已安装 Node.js
    echo 2. 如果已安装，请手动查找 node.exe 文件
    echo 3. 或重新安装 Node.js（推荐安装到默认位置）
) else (
    echo ====================================
    echo ✅ 找到 Node.js 安装路径
    echo ====================================
    echo.
    if defined NODE_PATH (
        echo 安装路径：%NODE_PATH%
        echo.
        echo 验证安装：
        "%NODE_PATH%\node.exe" --version
        if exist "%NODE_PATH%\npm.cmd" (
            echo.
            echo npm 路径：%NODE_PATH%\npm.cmd
            "%NODE_PATH%\npm.cmd" --version
        )
    )
    echo.
    echo 如果 Node.js 不在 PATH 中，可以：
    echo 1. 将此路径添加到系统 PATH 环境变量
    echo 2. 或使用批处理脚本时，脚本会自动找到此路径
)

echo.
echo ====================================
pause

