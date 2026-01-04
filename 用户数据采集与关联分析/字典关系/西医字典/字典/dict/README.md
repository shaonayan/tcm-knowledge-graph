# 医学疾病名词提取工具

## 功能说明

该工具用于从医学疾病名词PDF文件中提取所有中文疾病名称（包括主名和别名），并将其保存为TXT字典文件，格式为一行一个疾病名称。生成的字典文件可直接用于后续的分词操作。

## 适用格式

适用于以下格式的医学疾病名词PDF：
```
1型糖尿病性视网膜病变 type 1 diabetic retinopathy [又称]1型糖尿病视网膜病变
2型糖尿病性白内障 type 2 diabetic cataract
AIDS性视网膜病变 AIDS retinopathy
```

## 安装依赖

在使用前需要安装以下Python库：

```bash
pip install pdfplumber pytesseract pillow
```

### Tesseract OCR引擎安装

由于程序支持OCR功能（用于处理扫描版PDF），您还需要安装Tesseract OCR引擎：

#### Windows系统
1. 下载安装包：[Tesseract at UB Mannheim](https://github.com/UB-Mannheim/tesseract/wiki)
2. 安装时建议选择"Add to PATH"选项
3. 确保安装了中文语言包（默认包含）

#### macOS系统
```bash
brew install tesseract
brew install tesseract-lang
```

#### Linux系统
```bash
sudo apt-get install tesseract-ocr
sudo apt-get install tesseract-ocr-chi-sim  # 安装中文语言包
```

## 使用方法

1. 将您的医学疾病名词PDF文件放入任意目录

2. 运行提取工具：
   ```bash
   python medical_disease_extractor.py
   ```

3. 根据提示输入PDF文件的完整路径（例如）：
   ```
   请输入医学疾病名词PDF文件的路径：c:\Users\username\Documents\medical_diseases.pdf
   ```

   或者直接在命令行参数中指定PDF路径：
   ```bash
   python medical_disease_extractor.py "c:\Users\username\Documents\medical_diseases.pdf"
   ```

4. 程序将自动处理并生成字典文件

## 输出结果

- 生成的字典文件名为：`[原PDF文件名]_dictionary.txt`
- 保存位置与输入PDF文件相同
- 文件格式：每行一个疾病名称，已去重并按中文排序

## 示例输出

```
1型糖尿病伴有眼的并发症
1型糖尿病性白内障
1型糖尿病性虹膜炎
1型糖尿病性视神经病变
1型糖尿病性视网膜病变
1型糖尿病增殖性视网膜病变
2型糖尿病性白内障
2型糖尿病性虹膜炎
...
```

## 功能特点

1. **精准提取**：
   - 自动识别中文疾病名称（包含数字前缀如"1型"、"2型"）
   - 智能提取"[又称]"标记后的所有别名
   - 自动过滤英文名称和无关内容

2. **数据清洗**：
   - 自动去除行首编号
   - 自动去重，避免重复疾病名称
   - 去除多余空白字符

3. **OCR支持**：
   - 自动检测并处理扫描版PDF文件
   - 使用Tesseract OCR引擎进行中文识别
   - 可配置的识别参数

4. **易于使用**：
   - 支持交互式输入和命令行参数
   - 详细的运行状态提示
   - 自动生成输出文件名

## 注意事项

1. 确保PDF文件中的疾病名称格式符合预期（中文疾病名 + 英文名称 + [又称] + 别名）
2. 程序自动支持OCR处理扫描版PDF，但需要安装Tesseract OCR引擎
3. 复杂格式的PDF可能需要调整正则表达式
4. OCR识别速度较慢，处理大型扫描版PDF可能需要较长时间
5. 为提高OCR识别准确率，建议使用分辨率较高的PDF文件

## 示例

本目录中的医学疾病名词PDF文件可用于测试工具功能。
