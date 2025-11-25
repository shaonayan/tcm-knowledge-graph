@echo off
chcp 65001 >nul
echo ====================================
echo 少纳言中医知识图谱 - 一键部署
echo ====================================
echo.

echo [步骤 1/4] 检查环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未检测到Node.js，请先安装Node.js 18+
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js环境正常
echo.

echo [步骤 2/4] 安装前端依赖...
cd frontend
if not exist "node_modules" (
    echo 正在安装前端依赖，请稍候...
    call npm install
    if errorlevel 1 (
        echo ❌ 前端依赖安装失败
        cd ..
        pause
        exit /b 1
    )
) else (
    echo ✅ 前端依赖已存在，跳过安装
)
echo.

echo [步骤 3/4] 构建前端应用...
call npm run build
if errorlevel 1 (
    echo ❌ 前端构建失败
    cd ..
    pause
    exit /b 1
)
echo ✅ 前端构建完成
cd ..
echo.

echo [步骤 4/4] 检查后端配置...
cd backend
if not exist ".env" (
    echo ⚠️  未找到.env文件
    if exist "env.example" (
        echo 正在从env.example创建.env文件...
        copy env.example .env
        echo.
        echo ⚠️  重要：请编辑 backend\.env 文件，填入正确的Neo4j配置
        echo     - NEO4J_URI: Neo4j连接地址
        echo     - NEO4J_USER: Neo4j用户名
        echo     - NEO4J_PASSWORD: Neo4j密码
        echo.
        pause
    ) else (
        echo ❌ 未找到env.example文件
        cd ..
        pause
        exit /b 1
    )
) else (
    echo ✅ 后端配置文件存在
)
cd ..
echo.

echo ====================================
echo ✅ 部署准备完成！
echo ====================================
echo.
echo 下一步操作：
echo.
echo 1. 编辑 backend\.env 文件，配置Neo4j连接信息
echo.
echo 2. 启动生产服务器：
echo    cd backend
echo    node server-simple.js
echo.
echo    或者使用启动脚本：
echo    启动生产服务器.bat
echo.
echo 3. 访问应用：
echo    http://localhost:3001
echo.
echo ====================================
pause

