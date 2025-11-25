@echo off
chcp 65001 >nul
echo ====================================
echo 生成软件著作权申请PDF文档
echo ====================================
echo.

cd /d "%~dp0"

echo [步骤1] 检查Pandoc安装...
pandoc -v >nul 2>&1
if errorlevel 1 (
    echo ❌ Pandoc未安装或未添加到PATH
    echo 请确保已安装Pandoc并添加到系统PATH
    pause
    exit /b 1
)
echo ✅ Pandoc已安装

echo.
echo [步骤2] 生成PDF文档...
echo.

REM 生成用户操作手册PDF
echo 正在生成：用户操作手册.pdf...
pandoc "用户操作手册.md" -o "用户操作手册.pdf" --pdf-engine=wkhtmltopdf 2>nul
if errorlevel 1 (
    pandoc "用户操作手册.md" -o "用户操作手册.pdf" -V geometry:margin=2cm -V CJKmainfont="Microsoft YaHei" 2>nul
    if errorlevel 1 (
        echo ⚠️  用户操作手册.pdf 生成失败（可能需要LaTeX引擎）
        echo 建议：使用Word打开Markdown文件，然后另存为PDF
    ) else (
        echo ✅ 用户操作手册.pdf 已生成
    )
) else (
    echo ✅ 用户操作手册.pdf 已生成
)

REM 生成技术文档PDF
echo 正在生成：技术文档.pdf...
pandoc "技术文档.md" -o "技术文档.pdf" --pdf-engine=wkhtmltopdf 2>nul
if errorlevel 1 (
    pandoc "技术文档.md" -o "技术文档.pdf" -V geometry:margin=2cm -V CJKmainfont="Microsoft YaHei" 2>nul
    if errorlevel 1 (
        echo ⚠️  技术文档.pdf 生成失败（可能需要LaTeX引擎）
    ) else (
        echo ✅ 技术文档.pdf 已生成
    )
) else (
    echo ✅ 技术文档.pdf 已生成
)

REM 生成软件信息PDF
echo 正在生成：软件信息.pdf...
pandoc "软件信息.md" -o "软件信息.pdf" --pdf-engine=wkhtmltopdf 2>nul
if errorlevel 1 (
    pandoc "软件信息.md" -o "软件信息.pdf" -V geometry:margin=2cm -V CJKmainfont="Microsoft YaHei" 2>nul
    if errorlevel 1 (
        echo ⚠️  软件信息.pdf 生成失败（可能需要LaTeX引擎）
    ) else (
        echo ✅ 软件信息.pdf 已生成
    )
) else (
    echo ✅ 软件信息.pdf 已生成
)

REM 生成API接口文档PDF
echo 正在生成：API接口文档.pdf...
pandoc "API接口文档.md" -o "API接口文档.pdf" --pdf-engine=wkhtmltopdf 2>nul
if errorlevel 1 (
    pandoc "API接口文档.md" -o "API接口文档.pdf" -V geometry:margin=2cm -V CJKmainfont="Microsoft YaHei" 2>nul
    if errorlevel 1 (
        echo ⚠️  API接口文档.pdf 生成失败（可能需要LaTeX引擎）
    ) else (
        echo ✅ API接口文档.pdf 已生成
    )
) else (
    echo ✅ API接口文档.pdf 已生成
)

echo.
echo ====================================
echo PDF生成完成
echo ====================================
echo.
echo 如果某些PDF生成失败，可以使用以下方法：
echo 1. 使用Word打开Markdown文件，然后另存为PDF
echo 2. 安装MiKTeX或wkhtmltopdf以支持PDF生成
echo.
pause

