# bio_formatter.py
import os
from typing import List, Dict, Tuple

def sentence_to_bio(sentence: str, entities: list, label_types=None) -> list:
    """
    将句子和实体列表转换为 BIO 标注序列（按字）
    
    Args:
        sentence (str): 原始句子
        entities (list): [{"text": "...", "type": "XXX", "start": int}, ...]
        label_types (set): 所有合法标签类型，用于验证（可选）
    
    Returns:
        List[str]: 每个字对应的 BIO 标签
    """
    if label_types is None:
        label_types = {"Syndrome", "Herb", "Formula", "Symptom", "Disease", 
                      "Medicine", "Body_Part", "Medical_Examination", "Treatment"}

    # 初始化所有位置为 'O'
    tags = ['O'] * len(sentence)
    
    # 按实体长度降序排序（优先匹配长实体，避免“党参”被“参”截断）
    sorted_entities = sorted(entities, key=lambda x: len(x["text"]), reverse=True)
    
    for ent in sorted_entities:
        text = ent["text"]
        ent_type = ent["type"]
        start = ent["start"]
        end = start + len(text)
        
        # 边界检查
        if end > len(sentence) or sentence[start:end] != text:
            print(f"⚠️ 警告：实体 '{text}' 位置 {start} 与句子不匹配，跳过。")
            continue
        
        # 检查标签合法性
        if ent_type not in label_types:
            print(f"⚠️ 警告：未知实体类型 '{ent_type}'，跳过。")
            continue
        
        # 只在当前标签为 'O' 的位置写入（避免覆盖）
        if tags[start] == 'O':
            tags[start] = f'B-{ent_type}'
            for i in range(start + 1, end):
                if tags[i] == 'O':  # 不覆盖已有标签
                    tags[i] = f'I-{ent_type}'
    
    return tags


def write_bio_file(sentences_with_entities, output_path, label_types=None):
    """
    将多个 (sentence, entities) 写入标准 BIO 文件
    
    Args:
        sentences_with_entities: List of (sentence: str, entities: list)
        output_path: 输出文件路径
        label_types: 合法标签集合
    """
    with open(output_path, 'w', encoding='utf-8') as f:
        for sent, ents in sentences_with_entities:
            if not sent.strip():
                continue
            bio_tags = sentence_to_bio(sent, ents, label_types)
            for char, tag in zip(sent, bio_tags):
                f.write(f"{char}\t{tag}\n")
            f.write("\n")  # 空行分隔句子


def read_bio_file(bio_path: str) -> List[Tuple[str, List[str]]]:
    """
    读取BIO格式文件
    
    Args:
        bio_path: BIO文件路径
        
    Returns:
        List of (sentence, tags) tuples
    """
    sentences = []
    current_sentence = []
    current_tags = []
    
    with open(bio_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:  # 空行表示句子结束
                if current_sentence:
                    sentences.append((''.join(current_sentence), current_tags))
                    current_sentence = []
                    current_tags = []
            else:
                parts = line.split('\t')
                if len(parts) == 2:
                    char, tag = parts
                    current_sentence.append(char)
                    current_tags.append(tag)
    
    # 处理最后一个句子（如果没有以空行结尾）
    if current_sentence:
        sentences.append((''.join(current_sentence), current_tags))
        
    return sentences


# ================== 示例使用 ==================
if __name__ == "__main__":
    # 定义你的实体类型（必须与模型标签一致）
    LABEL_TYPES = {"Syndrome", "Herb", "Formula", "Symptom", "Disease", 
                  "Medicine", "Body_Part", "Medical_Examination", "Treatment"}
    
    # 示例数据：(句子, 实体列表)
    data = [
        (
            "脾气虚患者常服四君子汤，主症为食少便溏。",
            [
                {"text": "脾气虚", "type": "Syndrome", "start": 0},
                {"text": "四君子汤", "type": "Formula", "start": 7},
                {"text": "食少", "type": "Symptom", "start": 15},
                {"text": "便溏", "type": "Symptom", "start": 17}
            ]
        ),
        (
            "党参、白术、茯苓是四君子汤的主要成分。",
            [
                {"text": "党参", "type": "Herb", "start": 0},
                {"text": "白术", "type": "Herb", "start": 3},
                {"text": "茯苓", "type": "Herb", "start": 6},
                {"text": "四君子汤", "type": "Formula", "start": 10}
            ]
        )
    ]
    
    # 生成并保存 BIO 文件
    write_bio_file(data, "train.bio", label_types=LABEL_TYPES)
    
    print("✅ BIO 文件已生成：train.bio")
    
    # 读取并验证
    sentences = read_bio_file("train.bio")
    print(f"\n读取了 {len(sentences)} 个句子")
    
    # 打印预览
    with open("train.bio", 'r', encoding='utf-8') as f:
        print("\n预览前10行：")
        for i, line in enumerate(f):
            if i >= 10:
                break
            print(line.rstrip())