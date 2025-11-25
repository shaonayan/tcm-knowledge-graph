@echo off
chcp 65001 >nul
echo ========================================
echo   检查GitHub仓库状态
echo ========================================
echo.

echo [1/3] 检查Git配置...
if exist ".git\config" (
    echo ✅ Git仓库已初始化
    echo.
    echo 远程仓库配置：
    findstr "url" .git\config
    echo.
) else (
    echo ❌ Git仓库未初始化
    pause
    exit /b 1
)

echo [2/3] 检查远程仓库连接...
git remote -v
if %errorlevel% neq 0 (
    echo ⚠️  无法执行git命令，请检查Git是否已安装
    echo.
    echo 您的远程仓库地址：
    echo https://github.com/shaonayan/tcm-knowledge-graph.git
    echo.
    echo 请在浏览器中访问此地址查看仓库状态
    pause
    exit /b 0
)
echo.

echo [3/3] 检查本地提交状态...
git status
echo.

echo ========================================
echo   检查完成
echo ========================================
echo.
echo 您的GitHub仓库地址：
echo https://github.com/shaonayan/tcm-knowledge-graph.git
echo.
echo 请在浏览器中访问此地址查看：
echo - 是否已有文件
echo - 最后一次提交时间
echo - 仓库状态
echo.
pause

