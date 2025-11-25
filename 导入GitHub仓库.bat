@echo off
chcp 65001 >nul
echo ========================================
echo   中医知识图谱 - 导入GitHub仓库
echo ========================================
echo.

echo [1/5] 检查Git是否安装...
where git >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未检测到Git，请先安装Git
    echo 下载地址: https://git-scm.com/download/win
    echo.
    echo 安装完成后，请重新运行此脚本
    pause
    exit /b 1
)
echo ✅ Git已安装
git --version
echo.

echo [2/5] 检查是否已初始化Git仓库...
if exist ".git" (
    echo ⚠️  已存在Git仓库
    echo.
    set /p continue=是否继续？(Y/N): 
    if /i not "%continue%"=="Y" (
        echo 已取消
        pause
        exit /b 0
    )
) else (
    echo 正在初始化Git仓库...
    git init
    if %errorlevel% neq 0 (
        echo ❌ Git初始化失败
        pause
        exit /b 1
    )
    echo ✅ Git仓库初始化成功
)
echo.

echo [3/5] 检查.gitignore文件...
if not exist ".gitignore" (
    echo ⚠️  未找到.gitignore文件
    echo 正在创建默认.gitignore...
    echo node_modules/ > .gitignore
    echo .env >> .gitignore
    echo dist/ >> .gitignore
    echo ✅ .gitignore已创建
) else (
    echo ✅ .gitignore文件存在
)
echo.

echo [4/5] 添加文件到Git...
git add .
if %errorlevel% neq 0 (
    echo ❌ 添加文件失败
    pause
    exit /b 1
)
echo ✅ 文件已添加到暂存区
echo.

echo [5/5] 创建初始提交...
git commit -m "初始提交：中医知识图谱项目"
if %errorlevel% neq 0 (
    echo ⚠️  提交失败，可能是没有更改或已提交
    echo 继续下一步...
) else (
    echo ✅ 初始提交创建成功
)
echo.

echo ========================================
echo   Git仓库准备完成！
echo ========================================
echo.
echo 下一步操作：
echo.
echo 1. 在GitHub上创建新仓库：
echo    - 访问 https://github.com/new
echo    - 仓库名称：tcm-knowledge-graph（或您喜欢的名称）
echo    - 选择 Public 或 Private
echo    - 不要勾选"初始化README"等选项
echo    - 点击"Create repository"
echo.
echo 2. 连接本地仓库到GitHub：
echo    复制GitHub提供的命令，或使用以下命令：
echo.
echo    git remote add origin https://github.com/您的用户名/tcm-knowledge-graph.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 3. 或者使用GitHub Desktop：
echo    - 下载 GitHub Desktop: https://desktop.github.com/
echo    - 打开GitHub Desktop
echo    - 选择 File ^> Add Local Repository
echo    - 选择当前目录
echo    - 点击 Publish repository
echo.
echo ========================================
echo.
echo 按任意键查看当前Git状态...
pause >nul
git status
echo.
echo ========================================
pause

