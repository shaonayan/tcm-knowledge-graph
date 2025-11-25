@echo off
chcp 65001 >nul
title 添加 Node.js 到系统 PATH

echo ====================================
echo 添加 Node.js (D:\) 到系统 PATH
echo ====================================
echo.

REM 检查管理员权限
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ 检测到管理员权限
    echo.
    echo 正在添加 D:\ 到系统 PATH...
    echo.
    
    REM 获取当前系统 PATH
    for /f "tokens=2*" %%A in ('reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul') do set "CURRENT_PATH=%%B"
    
    REM 检查是否已存在
    echo %CURRENT_PATH% | findstr /C:"D:\" >nul
    if %errorLevel% == 0 (
        echo ✅ D:\ 已在系统 PATH 中
        echo.
        echo 当前 PATH 包含 D:\
        echo.
    ) else (
        REM 添加 D:\ 到 PATH
        setx /M PATH "%CURRENT_PATH%;D:\" >nul
        if %errorLevel% == 0 (
            echo ✅ 成功添加 D:\ 到系统 PATH
            echo.
            echo ⚠️  重要：请关闭并重新打开所有 PowerShell/CMD 窗口
            echo    以使环境变量生效
            echo.
        ) else (
            echo ❌ 添加失败，请检查权限
        )
    )
    
    echo ====================================
    echo 验证
    echo ====================================
    echo.
    echo 请在新的 PowerShell/CMD 窗口中运行：
    echo   node --version
    echo   npm --version
    echo.
    
) else (
    echo ❌ 需要管理员权限
    echo.
    echo 请右键点击此文件，选择"以管理员身份运行"
    echo.
    echo 或者手动添加：
    echo 1. 按 Win + R，输入：sysdm.cpl
    echo 2. 环境变量 → 系统变量 → Path → 编辑
    echo 3. 新建 → 输入：D:\
    echo 4. 确定保存
    echo.
)

pause

