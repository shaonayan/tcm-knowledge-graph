import pandas as pd
import os

# 读取Excel文件
file_path = '实验2 2005-2010中国各地区资本形成总额.xlsx'
print(f"正在读取文件: {file_path}")
print(f"文件是否存在: {os.path.exists(file_path)}")

try:
    # 读取Excel数据
    df = pd.read_excel(file_path)
    print("\n数据读取成功！")
    print("\n数据形状:", df.shape)
    print("\n列名:")
    for i, col in enumerate(df.columns):
        print(f"{i}: {col}")
    
    # 识别年份列（2005-2010）
    year_cols = []
    for year in range(2005, 2011):
        for col in df.columns:
            if str(year) in str(col):
                year_cols.append((year, col))
                break
    
    if year_cols:
        print(f"\n找到 {len(year_cols)} 个年份列")
        
        # 计算每年的平均资本形成总额
        yearly_avgs = {}
        for year, col in year_cols:
            try:
                numeric_data = pd.to_numeric(df[col], errors='coerce').dropna()
                avg = numeric_data.mean()
                yearly_avgs[year] = avg
                print(f"{year}年平均资本形成总额: {avg:.2f}")
            except Exception as e:
                print(f"处理{year}年数据时出错: {e}")
        
        # 计算总体平均值
        if yearly_avgs:
            overall_avg = sum(yearly_avgs.values()) / len(yearly_avgs)
            print(f"\n2005-2010年间平均每年资本形成总额均值: {overall_avg:.2f}")
    else:
        # 如果自动识别失败，尝试所有数值列
        print("\n未能自动识别年份列，尝试所有数值列...")
        numeric_cols = df.select_dtypes(include=['number']).columns
        if len(numeric_cols) > 0:
            print(f"找到 {len(numeric_cols)} 个数值列")
            
            # 计算每列平均值
            col_avgs = []
            for col in numeric_cols:
                avg = df[col].mean()
                col_avgs.append(avg)
                print(f"{col}: {avg:.2f}")
            
            # 计算总体平均值
            overall_avg = sum(col_avgs) / len(col_avgs)
            print(f"\n2005-2010年间平均每年资本形成总额均值: {overall_avg:.2f}")
        else:
            print("\n未找到数值列，请检查数据格式")
            print("\n数据预览:")
            print(df.head())
            
except Exception as e:
    print(f"读取文件时出错: {e}")
    print("\n请确保已安装pandas和openpyxl:")
    print("pip install pandas openpyxl")