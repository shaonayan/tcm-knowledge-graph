@echo off
chcp 65001 >nul
echo ====================================
echo 少纳言中医知识图谱 - 部署脚本
echo ====================================
echo.

echo [1/4] 检查Node.js环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 未检测到Node.js，请先安装Node.js
    pause
    exit /b 1
)
echo ✅ Node.js环境正常
echo.

echo [2/4] 安装前端依赖...
cd frontend
call npm install
if errorlevel 1 (
    echo ❌ 前端依赖安装失败
    pause
    exit /b 1
)
echo ✅ 前端依赖安装完成
echo.

echo [3/4] 构建前端应用...
call npm run build
if errorlevel 1 (
    echo ❌ 前端构建失败
    pause
    exit /b 1
)
echo ✅ 前端构建完成
cd ..
echo.

echo [4/4] 检查后端配置...
if not exist "backend\.env" (
    echo ⚠️  未找到backend\.env文件
    echo 正在从env.example创建...
    copy backend\env.example backend\.env
    echo ⚠️  请编辑backend\.env文件，填入正确的配置
    echo.
    pause
)
echo ✅ 后端配置检查完成
echo.

echo ====================================
echo 部署准备完成！
echo ====================================
echo.
echo 下一步：
echo 1. 编辑 backend\.env 文件，配置Neo4j连接信息
echo 2. 运行: cd backend ^&^& node server-production.js
echo 3. 访问: http://localhost:3001
echo.
pause

