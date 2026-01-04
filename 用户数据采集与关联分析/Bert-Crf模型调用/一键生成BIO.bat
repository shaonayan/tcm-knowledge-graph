@echo off
echo ==========================================
echo 医学实体抽取并生成BIO文件
echo 分别生成中医和西医的BIO文件
echo 输出结果放置在 ./输出结果 文件夹中
echo ==========================================
echo.

cd /d "%~dp0"
echo 当前目录: %cd%
echo.

echo 正在运行实体抽取程序...
python run_bio_extraction.py

echo.
echo 程序执行完毕！
echo 生成的文件:
echo   - 中医BIO文件: ./输出结果/train_chinese.bio
echo   - 西医BIO文件: ./输出结果/train_western.bio
echo   - 中医结构化实体: ./输出结果/chinese_entities.json
echo   - 西医结构化实体: ./输出结果/western_entities.json
echo.

echo 正在验证生成的文件...
python verify_bio_files.py

echo.
echo 所有任务已完成！
pause