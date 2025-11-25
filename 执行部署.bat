@echo off
chcp 65001 >nul
title 少纳言中医知识图谱 - 部署中...

echo.
echo ====================================
echo   少纳言中医知识图谱 - 开始部署
echo ====================================
echo.

REM 检查Node.js
echo [1/5] 检查Node.js环境...
where node >nul 2>&1
if errorlevel 1 (
    REM 尝试使用已知路径 D:\node.exe
    if exist "D:\node.exe" (
        echo ✅ 找到Node.js: D:\node.exe
        set "NODE_CMD=D:\node.exe"
        set "NPM_CMD=D:\npm.cmd"
        goto :node_found
    )
    echo.
    echo ❌ 错误：未找到Node.js
    echo.
    echo 请先安装Node.js：
    echo 1. 访问 https://nodejs.org/
    echo 2. 下载并安装LTS版本
    echo 3. 安装后重启此窗口
    echo.
    pause
    exit /b 1
)

:node_found
if defined NODE_CMD (
    "%NODE_CMD%" --version
    echo ✅ Node.js环境正常（使用路径：D:\）
) else (
    node --version
    echo ✅ Node.js环境正常
)
echo.

REM 检查前端依赖
echo [2/5] 检查前端依赖...
cd frontend
if not exist "node_modules" (
    echo 正在安装前端依赖，请稍候...
    if defined NPM_CMD (
        call "%NPM_CMD%" install
    ) else (
        call npm install
    )
    if errorlevel 1 (
        echo.
        echo ❌ 前端依赖安装失败
        cd ..
        pause
        exit /b 1
    )
    echo ✅ 前端依赖安装完成
) else (
    echo ✅ 前端依赖已存在
)
echo.

REM 构建前端
echo [3/5] 构建前端应用...
if defined NPM_CMD (
    call "%NPM_CMD%" run build
) else (
    call npm run build
)
if errorlevel 1 (
    echo.
    echo ❌ 前端构建失败
    cd ..
    pause
    exit /b 1
)
echo ✅ 前端构建完成
cd ..
echo.

REM 检查后端配置
echo [4/5] 检查后端配置...
cd backend
if not exist ".env" (
    echo ⚠️  未找到.env文件
    if exist "env.example" (
        echo 正在从env.example创建.env文件...
        copy env.example .env >nul
        echo ✅ 已创建.env文件
        echo.
        echo ⚠️  重要：请编辑 backend\.env 文件，确认Neo4j密码正确
        echo.
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

REM 显示完成信息
echo [5/5] 部署准备完成！
echo.
echo ====================================
echo   ✅ 部署准备完成！
echo ====================================
echo.
echo 下一步操作：
echo.
echo 1. 确认 backend\.env 中的Neo4j配置正确
echo.
echo 2. 启动服务器（选择一种方式）：
echo.
echo    方式A：双击运行 "启动生产服务器.bat"
echo.
echo    方式B：手动启动：
echo       cd backend
echo       set NODE_ENV=production
echo       node server-simple.js
echo.
echo 3. 访问应用：
echo    http://localhost:3001
echo.
echo ====================================
echo.
pause

