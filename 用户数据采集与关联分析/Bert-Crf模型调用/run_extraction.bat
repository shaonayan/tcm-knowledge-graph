@echo off
echo === 医学实体抽取系统 ===
echo.

REM 检查Python是否可用
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误：未找到Python，请先安装Python 3.7或更高版本
    pause
    exit /b 1
)

echo ✅ Python环境检查通过
echo.

REM 运行实体抽取程序
echo 正在启动医学实体抽取程序...
python run_extraction.py

echo.
echo 程序执行完毕
pause