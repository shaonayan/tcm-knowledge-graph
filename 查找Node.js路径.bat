@echo off
chcp 65001 >nul
echo ========================================
echo   查找 Node.js 安装路径
echo ========================================
echo.
echo 正在搜索 node.exe...
echo.

REM 搜索常见位置
set "SEARCH_PATHS[0]=C:\Program Files"
set "SEARCH_PATHS[1]=C:\Program Files (x86)"
set "SEARCH_PATHS[2]=%LOCALAPPDATA%\Programs"
set "SEARCH_PATHS[3]=%APPDATA%"
set "SEARCH_PATHS[4]=%USERPROFILE%"
set "SEARCH_PATHS[5]=C:\Users\31600\AppData\Local"
set "SEARCH_PATHS[6]=C:\Users\31600\AppData\Roaming"
set "SEARCH_PATHS[7]=D:\Program Files"
set "SEARCH_PATHS[8]=E:\Program Files"

set "FOUND=0"

for /L %%i in (0,1,8) do (
    call set "CURRENT_PATH=%%SEARCH_PATHS[%%i]%%"
    if exist "!CURRENT_PATH!" (
        echo [搜索] !CURRENT_PATH!
        dir /s /b "!CURRENT_PATH!\node.exe" 2>nul | findstr /i "node.exe" >nul
        if !errorlevel! equ 0 (
            for /f "delims=" %%f in ('dir /s /b "!CURRENT_PATH!\node.exe" 2^>nul') do (
                echo.
                echo [找到] %%f
                echo [路径] %%~dpf
                set "NODE_PATH=%%~dpf"
                set "FOUND=1"
                goto :done
            )
        )
    )
)

:done
if "%FOUND%"=="0" (
    echo.
    echo [未找到] 在常见位置未找到 node.exe
    echo.
    echo [建议] 请手动查找：
    echo 1. 打开文件资源管理器
    echo 2. 在地址栏输入以下路径逐一检查：
    echo    - C:\Program Files\nodejs
    echo    - C:\Program Files (x86)\nodejs
    echo    - %LOCALAPPDATA%\Programs\nodejs
    echo    - %APPDATA%\npm
    echo.
    echo 3. 或者使用 Windows 搜索功能搜索 "node.exe"
    echo.
) else (
    echo.
    echo ========================================
    echo [成功] 找到 Node.js
    echo ========================================
    echo.
    echo Node.js 路径: %NODE_PATH%
    echo.
    echo [下一步] 请复制上面的路径，然后：
    echo 1. 按 Win + R，输入 sysdm.cpl，回车
    echo 2. 点击"高级" -^> "环境变量"
    echo 3. 在"用户变量"中找到 Path，点击"编辑"
    echo 4. 点击"新建"，粘贴上面的路径
    echo 5. 点击"确定"保存
    echo 6. 重新打开命令行窗口
    echo.
)

pause
