@echo off
chcp 65001 >nul
echo ========================================
echo   添加 D:\ 到 PATH 环境变量
echo ========================================
echo.
echo [确认] Node.js 路径: D:\
echo.

REM 检查是否已经在PATH中
echo %PATH% | findstr /C:"D:\" >nul
if %errorlevel% equ 0 (
    echo [信息] D:\ 已经在 PATH 中
    echo.
    echo [测试] 正在测试 Node.js...
    set "PATH=%PATH%;D:\"
    node --version >nul 2>&1
    if %errorlevel% equ 0 (
        node --version
        npm --version
        echo.
        echo [成功] Node.js 已可用！
    ) else (
        echo [警告] 需要重新打开命令行窗口
    )
    echo.
    pause
    exit /b 0
)

echo [操作] 正在添加到 PATH...
echo.

REM 获取当前用户PATH
for /f "tokens=2*" %%a in ('reg query "HKCU\Environment" /v PATH 2^>nul') do set "CURRENT_PATH=%%b"

REM 添加D:\到PATH
if "%CURRENT_PATH%"=="" (
    setx PATH "D:\" >nul 2>&1
) else (
    setx PATH "%CURRENT_PATH%;D:\" >nul 2>&1
)

if %errorlevel% equ 0 (
    echo [成功] D:\ 已添加到 PATH
    echo.
    echo [提示] 请关闭并重新打开命令提示符或PowerShell，使更改生效
    echo.
    echo [测试] 正在测试 Node.js（临时添加到当前会话）...
    echo.
    
    REM 临时添加到当前会话的PATH
    set "PATH=%PATH%;D:\"
    
    node --version >nul 2>&1
    if %errorlevel% equ 0 (
        node --version
        npm --version
        echo.
        echo [完成] Node.js 和 npm 已可用！
        echo.
        echo [注意] 当前窗口已可用，但建议重新打开新窗口以确保完全生效
    ) else (
        echo [警告] 需要重新打开命令行窗口才能使用
    )
) else (
    echo [错误] 添加失败，可能需要管理员权限
    echo.
    echo [建议] 请右键点击此文件，选择"以管理员身份运行"
)

echo.
pause

