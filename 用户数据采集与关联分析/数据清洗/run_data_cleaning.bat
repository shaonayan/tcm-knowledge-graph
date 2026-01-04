@echo off
echo Installing required packages...
pip install -r requirements.txt

echo Running data cleaning script...
python data_cleaning.py

echo Data cleaning completed!
pause