@echo off
chcp 65001 >nul
echo ========================================
echo   中医知识图谱 - 快速公网部署工具
echo ========================================
echo.

echo [1/5] 检查Node.js环境...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未检测到Node.js，请先安装Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js已安装
node -v
echo.

echo [2/5] 检查项目结构...
if not exist "frontend" (
    echo ❌ 未找到frontend目录
    pause
    exit /b 1
)
if not exist "backend" (
    echo ❌ 未找到backend目录
    pause
    exit /b 1
)
echo ✅ 项目结构完整
echo.

echo [3/5] 构建前端...
cd frontend
if not exist "node_modules" (
    echo 正在安装前端依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ 前端依赖安装失败
        cd ..
        pause
        exit /b 1
    )
)
echo 正在构建前端...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ 前端构建失败
    cd ..
    pause
    exit /b 1
)
if not exist "dist" (
    echo ❌ 构建失败：未找到dist目录
    cd ..
    pause
    exit /b 1
)
echo ✅ 前端构建成功
cd ..
echo.

echo [4/5] 检查后端配置...
cd backend
if not exist ".env" (
    echo ⚠️  未找到.env文件，正在创建...
    copy env.example .env >nul 2>&1
    echo.
    echo ⚠️  请编辑 backend\.env 文件，配置以下信息：
    echo    - NEO4J_URI
    echo    - NEO4J_USER
    echo    - NEO4J_PASSWORD
    echo.
    echo 按任意键打开.env文件进行编辑...
    pause >nul
    notepad .env
) else (
    echo ✅ 后端配置文件存在
)
cd ..
echo.

echo [5/5] 部署选项
echo.
echo 请选择部署方式：
echo.
echo [1] 使用Vercel部署前端（推荐新手）
echo [2] 使用Railway部署后端
echo [3] 部署到云服务器（需要SSH）
echo [4] 使用内网穿透（ngrok）
echo [5] 仅构建，稍后手动部署
echo.
set /p choice=请输入选项 (1-5): 

if "%choice%"=="1" goto vercel
if "%choice%"=="2" goto railway
if "%choice%"=="3" goto server
if "%choice%"=="4" goto ngrok
if "%choice%"=="5" goto manual
goto end

:vercel
echo.
echo ========================================
echo   部署前端到Vercel
echo ========================================
echo.
echo 步骤：
echo 1. 访问 https://vercel.com 并登录
echo 2. 点击 "New Project"
echo 3. 选择您的Git仓库，或上传 frontend/dist 文件夹
echo 4. 配置：
echo    - Framework Preset: Vite
echo    - Root Directory: frontend
echo    - Build Command: npm run build
echo    - Output Directory: dist
echo 5. 添加环境变量：
echo    - VITE_API_URL=https://your-backend-url.com/api
echo.
echo 前端构建文件位置: frontend\dist
echo.
pause
goto end

:railway
echo.
echo ========================================
echo   部署后端到Railway
echo ========================================
echo.
echo 步骤：
echo 1. 访问 https://railway.app 并登录
echo 2. 点击 "New Project"
echo 3. 选择 "Deploy from GitHub repo" 或上传backend文件夹
echo 4. 添加环境变量：
echo    - NODE_ENV=production
echo    - PORT=3001
echo    - NEO4J_URI=neo4j+s://your-neo4j-uri
echo    - NEO4J_USER=neo4j
echo    - NEO4J_PASSWORD=your-password
echo    - FRONTEND_URL=https://your-frontend.vercel.app
echo 5. Railway会自动部署
echo.
echo 后端代码位置: backend\
echo.
pause
goto end

:server
echo.
echo ========================================
echo   部署到云服务器
echo ========================================
echo.
echo 请确保：
echo 1. 已购买云服务器（阿里云/腾讯云等）
echo 2. 已配置SSH密钥
echo 3. 服务器已安装Node.js和Nginx
echo.
echo 详细步骤请查看：网站公网部署指南.md
echo.
pause
goto end

:ngrok
echo.
echo ========================================
echo   使用内网穿透（ngrok）
echo ========================================
echo.
echo 步骤：
echo 1. 访问 https://ngrok.com 注册账号
echo 2. 下载ngrok并配置authtoken
echo 3. 启动后端服务：
echo    cd backend
echo    npm start
echo 4. 在另一个终端运行：
echo    ngrok http 3001
echo 5. 使用ngrok提供的公网地址访问
echo.
echo ⚠️  注意：免费版有流量限制，适合临时演示
echo.
pause
goto end

:manual
echo.
echo ========================================
echo   构建完成
echo ========================================
echo.
echo ✅ 前端构建文件: frontend\dist
echo ✅ 后端代码: backend\
echo.
echo 您可以：
echo 1. 将 frontend\dist 上传到静态网站托管服务
echo 2. 将 backend 部署到云服务器或PaaS平台
echo 3. 查看 "网站公网部署指南.md" 了解详细步骤
echo.
pause
goto end

:end
echo.
echo ========================================
echo   部署准备完成！
echo ========================================
echo.
echo 📖 详细部署指南：网站公网部署指南.md
echo.
pause

