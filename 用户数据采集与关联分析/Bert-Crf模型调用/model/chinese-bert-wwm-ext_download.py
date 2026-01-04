from transformers import BertTokenizer, BertModel

# 指定模型名称（第一次运行会自动下载）
model_name = "hfl/chinese-bert-wwm-ext"

# 自动下载 tokenizer 和 model（约 400MB）
tokenizer = BertTokenizer.from_pretrained(model_name)
model = BertModel.from_pretrained(model_name)

# 测试
text = "脾气虚患者常用四君子汤。"
inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)
outputs = model(**inputs)

print("✅ BERT 加载成功！")
print("输入 token IDs:", inputs["input_ids"])
print("输出 shape:", outputs.last_hidden_state.shape)  # [1, seq_len, 768]