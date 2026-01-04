# 数据清洗工具

这个工具用于将数据爬取文件夹中的所有markdown、PDF和txt文件转换为txt格式，并保存到数据清洗文件夹中。

## 文件结构

```
数据清洗/
├── Data_ChineseMedicineScience/  # 中医数据文件夹
├── Data_WesternMedicine/         # 西医数据文件夹
├── data_cleaning.py              # 数据清洗脚本
├── requirements.txt              # 依赖包列表
├── run_data_cleaning.bat         # Windows批处理运行脚本
└── README.md                     # 说明文档
```

## 使用方法

### 方法1: 使用批处理脚本(Windows)
双击运行 `run_data_cleaning.bat` 文件，它会自动安装依赖并运行数据清洗脚本。

### 方法2: 手动运行
1. 安装依赖包:
   ```
   pip install -r requirements.txt
   ```

2. 运行数据清洗脚本:
   ```
   python data_cleaning.py
   ```

## 功能说明

- 自动遍历 `../数据爬取/Data_ChineseMedicineScience` 和 `../数据爬取/Data_WesternMedicine` 文件夹
- 支持处理以下格式的文件:
  - `.md` (Markdown) 文件 - 直接复制内容并保存为.txt
  - `.pdf` 文件 - 提取文本内容并保存为.txt
  - `.txt` 文件 - 直接复制
- 保持原有的文件夹结构
- 显示处理进度和统计信息

## 依赖包

- pdfplumber: 用于提取PDF文件中的文本
- tqdm: 用于显示处理进度条

## 注意事项

1. 确保在运行脚本前已安装Python环境
2. 脚本会自动创建目标文件夹结构
3. 如果某个文件处理失败，会在控制台输出错误信息，但不会中断整个处理过程
4. 转换后的文件统一保存为UTF-8编码