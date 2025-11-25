@echo off
chcp 65001 >nul
echo ========================================
echo   添加 Node.js 到 PATH 环境变量
echo ========================================
echo.

REM 检查常见的Node.js安装路径
set "NODE_PATHS[0]=C:\Program Files\nodejs"
set "NODE_PATHS[1]=C:\Program Files (x86)\nodejs"
set "NODE_PATHS[2]=%LOCALAPPDATA%\Programs\nodejs"
set "NODE_PATHS[3]=%APPDATA%\npm"
set "NODE_PATHS[4]=%USERPROFILE%\AppData\Local\Programs\nodejs"

echo 正在查找 Node.js 安装路径...
echo.

set "NODE_FOUND=0"
for /L %%i in (0,1,4) do (
    call set "CURRENT_PATH=%%NODE_PATHS[%%i]%%"
    if exist "!CURRENT_PATH!\node.exe" (
        echo [找到] !CURRENT_PATH!
        set "NODE_PATH=!CURRENT_PATH!"
        set "NODE_FOUND=1"
        goto :found
    )
)

:found
if "%NODE_FOUND%"=="0" (
    echo.
    echo [警告] 未在常见位置找到 Node.js
    echo.
    echo 请手动输入 Node.js 的安装路径：
    echo 例如: C:\Program Files\nodejs
    echo.
    set /p "NODE_PATH=请输入路径: "
    
    if not exist "%NODE_PATH%\node.exe" (
        echo.
        echo [错误] 路径无效，未找到 node.exe
        echo.
        pause
        exit /b 1
    )
)

echo.
echo [确认] Node.js 路径: %NODE_PATH%
echo.

REM 检查是否已经在PATH中
echo %PATH% | findstr /C:"%NODE_PATH%" >nul
if %errorlevel% equ 0 (
    echo [信息] Node.js 已经在 PATH 中
    echo.
    pause
    exit /b 0
)

echo [操作] 正在添加到 PATH...
echo.

REM 获取当前用户PATH
for /f "tokens=2*" %%a in ('reg query "HKCU\Environment" /v PATH 2^>nul') do set "CURRENT_PATH=%%b"

REM 添加Node.js到PATH
if "%CURRENT_PATH%"=="" (
    setx PATH "%NODE_PATH%;%NODE_PATH%\node_modules\npm\bin" >nul 2>&1
) else (
    setx PATH "%CURRENT_PATH%;%NODE_PATH%;%NODE_PATH%\node_modules\npm\bin" >nul 2>&1
)

if %errorlevel% equ 0 (
    echo [成功] Node.js 已添加到 PATH
    echo.
    echo [提示] 请关闭并重新打开命令提示符或PowerShell，使更改生效
    echo.
    echo [测试] 正在测试 Node.js...
    echo.
    
    REM 临时添加到当前会话的PATH
    set "PATH=%PATH%;%NODE_PATH%"
    
    node --version >nul 2>&1
    if %errorlevel% equ 0 (
        node --version
        npm --version
        echo.
        echo [完成] Node.js 和 npm 已可用！
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

