# BERT-CRF 医学实体抽取系统

这个系统用于从医学文本中抽取实体，并将其转换为BIO格式用于训练命名实体识别模型。

## 功能特性

1. 读取数据清洗文件夹中的所有txt文件
2. 使用规则和词典方法进行医学实体抽取（可扩展为BERT模型）
3. 将抽取结果转换为BIO格式
4. 支持多种医学实体类型：
   - Disease (疾病)
   - Symptom (症状)
   - Medicine (药物)
   - Herb (中草药)
   - Formula (方剂)
   - Syndrome (证候)
   - Body_Part (身体部位)
   - Medical_Examination (检查项目)
   - Treatment (治疗方法)

## 文件结构

```
Bert-Crf模型调用/
├── bio_formatter.py           # BIO格式转换工具
├── chinese-bert-wwm-ext_download.py  # BERT模型下载脚本
├── medical_entity_extractor.py        # 医学实体抽取主程序（依赖BERT）
├── simple_extractor.py        # 简化版实体抽取程序（不依赖BERT）
├── run_extraction.py         # 运行脚本
├── run_extraction.bat        # Windows批处理运行脚本
├── requirements.txt          # 依赖包列表
└── README.md                 # 说明文档
```

## 安装依赖

### 方法1: 使用pip安装
```bash
pip install -r requirements.txt
```

### 方法2: 自动安装
运行 `run_extraction.py` 或 `run_extraction.bat` 会自动安装依赖

## 使用方法

### 方法1: 使用简化版程序（推荐初学者）
```bash
python simple_extractor.py
```

### 方法2: 使用批处理脚本 (Windows)
双击运行 `run_extraction.bat`

### 方法3: 使用Python脚本
```bash
python run_extraction.py
```

### 方法4: 直接运行主程序（需要安装所有依赖）
```bash
python medical_entity_extractor.py
```

## 输出文件

程序运行后会生成以下文件：
- `../train.bio` - BIO格式的训练数据文件

## 工作流程

1. 程序会自动读取 `../数据清洗/Data_ChineseMedicineScience` 和 `../数据清洗/Data_WesternMedicine` 目录下的所有txt文件
2. 对每个文件中的文本进行预处理和句子分割
3. 使用规则和词典方法抽取医学实体
4. 将结果转换为BIO格式并保存到 `../train.bio` 文件中

## 实体类型说明

| 实体类型 | 中文含义 | 示例 |
|---------|---------|------|
| Disease | 疾病 | 胃炎、肺炎、肾炎 |
| Symptom | 症状 | 疼痛、发热、呕吐 |
| Medicine | 药物 | 阿莫西林、奥美拉唑 |
| Herb | 中草药 | 党参、白术、茯苓 |
| Formula | 方剂 | 四君子汤、六味地黄丸 |
| Syndrome | 证候 | 脾气虚、肾阳虚 |
| Body_Part | 身体部位 | 心脏、肝脏、胃部 |
| Medical_Examination | 检查项目 | 心电图、血常规 |
| Treatment | 治疗方法 | 针灸、推拿 |

## BIO格式说明

BIO格式是一种常用的命名实体识别标注格式：
- B-XXX: 实体开始
- I-XXX: 实体内部
- O: 非实体

示例：
```
胃	B-Disease
炎	I-Disease
患	O
者	O
```

## 自定义实体抽取模型

当前版本使用简单的规则匹配进行实体抽取。在实际应用中，您可以：

1. 训练自己的BERT-CRF模型
2. 替换 `extract_entities_simple` 方法中的实现
3. 加载训练好的模型进行预测

## 扩展为BERT-CRF模型

要使用真正的BERT-CRF模型进行实体抽取，您需要：

1. 准备训练数据（已由本系统生成的train.bio）
2. 使用BERT+CRF框架训练模型
3. 将训练好的模型集成到 `medical_entity_extractor.py` 中

## 注意事项

1. 简化版程序 `simple_extractor.py` 不依赖复杂的深度学习库，可以直接运行
2. 完整版程序 `medical_entity_extractor.py` 需要安装所有依赖包
3. 程序会处理大量文本数据，运行时间可能较长
4. 生成的BIO文件可用于训练自己的NER模型
5. 当前的实体抽取基于简单的关键词匹配，实际应用中应使用训练好的模型以获得更好的效果