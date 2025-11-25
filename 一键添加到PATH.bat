@echo off
chcp 65001 >nul
title 添加 Node.js 到 PATH

echo ====================================
echo 添加 Node.js (D:\) 到系统 PATH
echo ====================================
echo.

REM 检查是否已存在
echo %PATH% | findstr /C:"D:\" >nul
if %errorLevel% == 0 (
    echo ✅ D:\ 已在当前 PATH 中
    echo.
) else (
    REM 添加到当前会话
    set "PATH=%PATH%;D:\"
    echo ✅ 已添加到当前会话的 PATH
    echo.
)

REM 添加到用户环境变量（永久）
echo 正在添加到用户环境变量（永久）...
for /f "tokens=2*" %%A in ('reg query "HKCU\Environment" /v Path 2^>nul') do set "USER_PATH=%%B"

if "%USER_PATH%"=="" (
    setx PATH "D:\" >nul 2>&1
) else (
    echo %USER_PATH% | findstr /C:"D:\" >nul
    if %errorLevel% == 0 (
        echo ✅ D:\ 已在用户 PATH 中
    ) else (
        setx PATH "%USER_PATH%;D:\" >nul 2>&1
        if %errorLevel% == 0 (
            echo ✅ 已添加到用户 PATH（永久）
        ) else (
            echo ⚠️  添加到用户 PATH 失败，可能需要管理员权限
        )
    )
)

echo.
echo ====================================
echo 验证
echo ====================================
echo.

REM 验证当前会话
set "PATH=%PATH%;D:\"
where node >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ 当前会话可以使用 node 和 npm
    node --version
    npm --version
) else (
    echo ⚠️  当前会话无法使用，请重启窗口
)

echo.
echo ====================================
echo 完成
echo ====================================
echo.
echo ⚠️  重要：
echo 1. 用户 PATH 已更新（永久）
echo 2. 请关闭并重新打开所有 PowerShell/CMD 窗口
echo 3. 新窗口将自动包含 D:\ 在 PATH 中
echo.
echo 如果仍无法使用，请运行：
echo   添加Node.js到PATH-管理员.bat（以管理员身份）
echo.

pause

