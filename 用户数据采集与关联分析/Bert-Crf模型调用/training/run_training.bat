@echo off
echo === BERT-NER 医学实体识别模型训练 ===
echo.

REM 检查Python环境
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未找到Python环境，请先安装Python
    pause
    exit /b 1
)

REM 安装依赖包
echo 正在安装依赖包...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ⚠️  pip安装依赖包失败，将继续执行
)

REM 运行训练脚本
echo.
echo 正在启动模型训练...
python run_training.py

echo.
echo 训练流程结束
pause