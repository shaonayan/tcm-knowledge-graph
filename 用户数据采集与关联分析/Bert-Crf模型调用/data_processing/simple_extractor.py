#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
简化的医学实体抽取程序（不依赖BERT模型）
分别处理中医和西医数据，生成独立的BIO文件
"""

import os
import re
from typing import List, Dict, Tuple

# 导入现有的BIO格式化工具
from bio_formatter import sentence_to_bio, write_bio_file

# 医学实体类型定义
MEDICAL_ENTITY_TYPES = {
    "Disease": "疾病",
    "Symptom": "症状",
    "Medicine": "药物",
    "Herb": "中草药",
    "Formula": "方剂",
    "Syndrome": "证候",
    "Body_Part": "身体部位",
    "Medical_Examination": "检查项目",
    "Treatment": "治疗方法"
}

def read_text_files(data_dir: str) -> List[Tuple[str, str]]:
    """
    读取指定目录下的所有txt文件
    
    Args:
        data_dir: 数据目录路径
        
    Returns:
        List of (filename, content) tuples
    """
    texts = []
    print(f"正在读取目录: {data_dir}")
    
    if not os.path.exists(data_dir):
        print(f"❌ 目录不存在: {data_dir}")
        return texts
        
    for filename in os.listdir(data_dir):
        if filename.endswith('.txt'):
            file_path = os.path.join(data_dir, filename)
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    if content.strip():  # 只添加非空文件
                        texts.append((filename, content))
                        print(f"✅ 已读取: {filename}")
            except Exception as e:
                print(f"❌ 读取文件失败 {filename}: {e}")
                
    print(f"总共读取了 {len(texts)} 个文件")
    return texts

def preprocess_text(text: str) -> List[str]:
    """
    文本预处理，分割成句子
    
    Args:
        text: 原始文本
        
    Returns:
        句子列表
    """
    # 使用标点符号分割句子
    sentences = re.split(r'[。！？；;!?]', text)
    # 过滤掉空句子和只包含空白字符的句子
    sentences = [s.strip() for s in sentences if s.strip()]
    return sentences

def extract_entities_simple(text: str) -> List[Dict]:
    """
    使用简单的规则和词典方法抽取实体（作为baseline）
    这里只是一个示例，实际应用中应该使用训练好的模型
    
    Args:
        text: 输入文本
        
    Returns:
        实体列表
    """
    entities = []
    
    # 简单的关键词匹配（实际应用中应该使用更复杂的词典或模型）
    disease_keywords = ['胃炎', '胃溃疡', '肠炎', '肺炎', '肝炎', '肾炎', '心律不齐', '贫血', '高血压', '糖尿病', '胃病', '肝病', '心脏病']
    symptom_keywords = ['疼痛', '发热', '咳嗽', '呕吐', '腹泻', '头晕', '乏力', '恶心', '腹胀', '便秘', '胸闷', '心悸', '出汗', '失眠']
    medicine_keywords = ['阿莫西林', '奥美拉唑', '头孢', '青霉素', '阿司匹林', '布洛芬', '氯霉素']
    herb_keywords = ['党参', '白术', '茯苓', '甘草', '当归', '川芎', '白芍', '人参', '黄芪', '枸杞', '柴胡', '黄连', '黄芩', '半夏']
    formula_keywords = ['四君子汤', '六味地黄丸', '补中益气汤', '逍遥散', '小柴胡汤', '桂枝汤', '麻黄汤', '葛根汤']
    syndrome_keywords = ['脾气虚', '肾阳虚', '肝郁', '血瘀', '痰湿', '阴虚火旺', '气血不足', '肝火旺盛', '脾胃虚弱', '肾阴虚']
    
    # 查找疾病
    for keyword in disease_keywords:
        start = 0
        while True:
            pos = text.find(keyword, start)
            if pos == -1:
                break
            entities.append({
                "text": keyword,
                "type": "Disease",
                "start": pos
            })
            start = pos + 1
            
    # 查找症状
    for keyword in symptom_keywords:
        start = 0
        while True:
            pos = text.find(keyword, start)
            if pos == -1:
                break
            entities.append({
                "text": keyword,
                "type": "Symptom",
                "start": pos
            })
            start = pos + 1
            
    # 查找药物
    for keyword in medicine_keywords:
        start = 0
        while True:
            pos = text.find(keyword, start)
            if pos == -1:
                break
            entities.append({
                "text": keyword,
                "type": "Medicine",
                "start": pos
            })
            start = pos + 1
            
    # 查找中草药
    for keyword in herb_keywords:
        start = 0
        while True:
            pos = text.find(keyword, start)
            if pos == -1:
                break
            entities.append({
                "text": keyword,
                "type": "Herb",
                "start": pos
            })
            start = pos + 1
            
    # 查找方剂
    for keyword in formula_keywords:
        start = 0
        while True:
            pos = text.find(keyword, start)
            if pos == -1:
                break
            entities.append({
                "text": keyword,
                "type": "Formula",
                "start": pos
            })
            start = pos + 1
            
    # 查找证候
    for keyword in syndrome_keywords:
        start = 0
        while True:
            pos = text.find(keyword, start)
            if pos == -1:
                break
            entities.append({
                "text": keyword,
                "type": "Syndrome",
                "start": pos
            })
            start = pos + 1
            
    return entities

def process_single_text(text: str, filename: str = "") -> List[Tuple[str, List[Dict]]]:
    """
    处理单个文本文件，将其分割成句子并抽取实体
    
    Args:
        text: 输入文本
        filename: 文件名（用于日志）
        
    Returns:
        [(sentence, entities), ...]
    """
    print(f"正在处理文本: {filename}")
    sentences = preprocess_text(text)
    results = []
    
    for i, sentence in enumerate(sentences):
        if len(sentence) > 2:  # 过滤太短的句子
            entities = extract_entities_simple(sentence)
            if entities:  # 只保留包含实体的句子
                results.append((sentence, entities))
                
    print(f"从 {filename} 中提取了 {len(results)} 个包含实体的句子")
    return results

def process_all_texts(data_dirs: List[str]) -> List[Tuple[str, List[Dict]]]:
    """
    处理所有文本数据
    
    Args:
        data_dirs: 数据目录列表
        
    Returns:
        [(sentence, entities), ...]
    """
    all_results = []
    
    for data_dir in data_dirs:
        texts = read_text_files(data_dir)
        for filename, content in texts:
            results = process_single_text(content, filename)
            all_results.extend(results)
            
    print(f"总共处理了 {len(all_results)} 个包含实体的句子")
    return all_results

def bio_to_entities(bio_file_path: str) -> List[Dict]:
    """
    将BIO序列文件转换为结构化实体列表
    
    Args:
        bio_file_path: BIO文件路径
        
    Returns:
        实体列表，每个实体包含text, type, sentence字段
    """
    entities = []
    current_sentence = []
    current_tags = []
    
    print(f"正在处理BIO文件: {bio_file_path}")
    
    with open(bio_file_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:  # 空行表示句子结束
                if current_sentence and current_tags:
                    # 从当前句子和标签中提取实体
                    sentence_text = ''.join(current_sentence)
                    extracted_entities = extract_entities_from_bio_tags(current_sentence, current_tags)
                    # 为每个实体添加句子信息
                    for entity in extracted_entities:
                        entity["sentence"] = sentence_text
                        entities.append(entity)
                    # 重置
                    current_sentence = []
                    current_tags = []
            else:
                parts = line.split('\t')
                if len(parts) == 2:
                    char, tag = parts
                    current_sentence.append(char)
                    current_tags.append(tag)
    
    # 处理最后一个句子（如果没有以空行结尾）
    if current_sentence and current_tags:
        sentence_text = ''.join(current_sentence)
        extracted_entities = extract_entities_from_bio_tags(current_sentence, current_tags)
        for entity in extracted_entities:
            entity["sentence"] = sentence_text
            entities.append(entity)
    
    print(f"从BIO文件中提取了 {len(entities)} 个实体")
    return entities

def extract_entities_from_bio_tags(chars: List[str], tags: List[str]) -> List[Dict]:
    """
    从字符和BIO标签中提取实体
    
    Args:
        chars: 字符列表
        tags: 对应的BIO标签列表
        
    Returns:
        实体列表
    """
    entities = []
    current_entity_chars = []
    current_entity_type = None
    
    for i, (char, tag) in enumerate(zip(chars, tags)):
        if tag.startswith('B-'):  # 实体开始
            # 如果已经有正在进行的实体，先保存它
            if current_entity_chars and current_entity_type:
                entities.append({
                    "text": ''.join(current_entity_chars),
                    "type": current_entity_type
                })
            # 开始新实体
            current_entity_chars = [char]
            current_entity_type = tag[2:]  # 去掉"B-"前缀
        elif tag.startswith('I-') and current_entity_type == tag[2:]:  # 实体继续
            # 只有当标签类型与当前实体类型匹配时才继续
            current_entity_chars.append(char)
        else:  # 'O'标签或其他情况
            # 实体结束，保存它
            if current_entity_chars and current_entity_type:
                entities.append({
                    "text": ''.join(current_entity_chars),
                    "type": current_entity_type
                })
            # 重置
            current_entity_chars = []
            current_entity_type = None
    
    # 处理最后一个实体
    if current_entity_chars and current_entity_type:
        entities.append({
            "text": ''.join(current_entity_chars),
            "type": current_entity_type
        })
    
    return entities

def save_structured_entities(entities: List[Dict], output_path: str):
    """
    保存结构化实体到JSON文件
    
    Args:
        entities: 实体列表
        output_path: 输出文件路径
    """
    import json
    
    # 按类型分组实体
    entities_by_type = {}
    for entity in entities:
        entity_type = entity["type"]
        if entity_type not in entities_by_type:
            entities_by_type[entity_type] = []
        entities_by_type[entity_type].append(entity)
    
    # 保存到文件
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(entities_by_type, f, ensure_ascii=False, indent=2)
    
    print(f"结构化实体已保存到: {output_path}")

def main():
    """
    主函数 - 分别处理中医和西医数据
    """
    print("=== 简化版医学实体抽取系统 ===")
    
    # 确保输出目录存在
    output_dir = "./输出结果"
    os.makedirs(output_dir, exist_ok=True)
    
    # 分别处理中医和西医数据
    # 处理中医数据
    print("\n【处理中医数据】")
    chinese_data_dirs = ["../数据清洗/Data_ChineseMedicineScience"]
    chinese_sentences_with_entities = process_all_texts(chinese_data_dirs)
    
    # 生成中医BIO格式文件
    if chinese_sentences_with_entities:
        chinese_bio_output_path = os.path.join(output_dir, "train_chinese.bio")
        print("正在生成中医BIO格式文件...")
        try:
            write_bio_file(chinese_sentences_with_entities, chinese_bio_output_path, 
                         label_types=set(MEDICAL_ENTITY_TYPES.keys()))
            print(f"✅ 中医BIO格式文件已生成: {chinese_bio_output_path}")
            
            # 后处理：将BIO转换为结构化实体
            print("正在进行后处理：将BIO转换为结构化实体...")
            chinese_entities = bio_to_entities(chinese_bio_output_path)
            chinese_structured_output_path = os.path.join(output_dir, "chinese_entities.json")
            save_structured_entities(chinese_entities, chinese_structured_output_path)
            print(f"✅ 中医结构化实体已保存: {chinese_structured_output_path}")
        except Exception as e:
            print(f"❌ 生成中医BIO文件失败: {e}")
    else:
        print("❌ 没有找到包含实体的中医句子")
    
    # 处理西医数据
    print("\n【处理西医数据】")
    western_data_dirs = ["../数据清洗/Data_WesternMedicine"]
    western_sentences_with_entities = process_all_texts(western_data_dirs)
    
    # 生成西医BIO格式文件
    if western_sentences_with_entities:
        western_bio_output_path = os.path.join(output_dir, "train_western.bio")
        print("正在生成西医BIO格式文件...")
        try:
            write_bio_file(western_sentences_with_entities, western_bio_output_path, 
                         label_types=set(MEDICAL_ENTITY_TYPES.keys()))
            print(f"✅ 西医BIO格式文件已生成: {western_bio_output_path}")
            
            # 后处理：将BIO转换为结构化实体
            print("正在进行后处理：将BIO转换为结构化实体...")
            western_entities = bio_to_entities(western_bio_output_path)
            western_structured_output_path = os.path.join(output_dir, "western_entities.json")
            save_structured_entities(western_entities, western_structured_output_path)
            print(f"✅ 西医结构化实体已保存: {western_structured_output_path}")
        except Exception as e:
            print(f"❌ 生成西医BIO文件失败: {e}")
    else:
        print("❌ 没有找到包含实体的西医句子")
    
    print("\n✅ 处理完成！")

if __name__ == "__main__":
    main()