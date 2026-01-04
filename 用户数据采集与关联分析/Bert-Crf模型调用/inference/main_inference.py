#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
BERT-CRF模型推理脚本
用于从JSON文件中批量抽取"脾虚"相关实体
"""

import json
import os
import sys

# 添加上级目录到Python路径，以便导入其他模块
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from typing import Dict, List


# 模型路径和输入JSON文件路径
MODEL_PATH = "../models/bert_crf_spleen.pth"
CHINESE_INPUT_JSON = "../输出结果/chinese_entities.json"
WESTERN_INPUT_JSON = "../输出结果/western_entities.json"


def extract_spleen_related_entities(json_file_path: str, file_type: str) -> List[Dict]:
    """
    从JSON文件中抽取脾虚相关实体
    
    Args:
        json_file_path: JSON文件路径
        file_type: 文件类型 ("chinese" 或 "western")
        
    Returns:
        脾虚相关实体列表
    """
    print(f"正在加载{file_type} JSON文件: {json_file_path}")
    
    if not os.path.exists(json_file_path):
        print(f"❌ JSON文件不存在: {json_file_path}")
        return []
    
    # 读取JSON文件
    with open(json_file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    spleen_related_entities = []
    
    # 遍历所有实体类型
    for entity_type, entities in data.items():
        print(f"正在检查 {entity_type} 类型的实体...")
        
        # 遍历该类型的所有实体
        for entity in entities:
            text = entity.get("text", "")
            sentence = entity.get("sentence", "")
            
            # 检查实体文本或句子中是否包含"脾虚"相关词汇
            if any(keyword in text or keyword in sentence for keyword in 
                   ["脾虚", "脾气虚", "脾阳虚", "脾阴虚", "脾胃虚弱", "脾不健运", "脾失健运"]):
                entity["matched_type"] = entity_type
                entity["source"] = file_type  # 标记来源
                spleen_related_entities.append(entity)
    
    print(f"✅ 从{file_type}数据中找到 {len(spleen_related_entities)} 个脾虚相关实体")
    return spleen_related_entities


def save_results(entities: List[Dict], output_file: str = "../输出结果/all_spleen_entities.json"):
    """
    保存结果到JSON文件
    
    Args:
        entities: 实体列表
        output_file: 输出文件路径
    """
    print(f"正在保存结果到: {output_file}")
    
    # 按类型和来源分组
    grouped_entities = {}
    for entity in entities:
        entity_type = entity.get("matched_type", "Unknown")
        source = entity.get("source", "unknown")
        key = f"{entity_type}_{source}"
        if key not in grouped_entities:
            grouped_entities[key] = []
        grouped_entities[key].append(entity)
    
    # 保存到文件
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(grouped_entities, f, ensure_ascii=False, indent=2)
    
    print("✅ 结果保存完成！")


def main():
    """主函数"""
    print("=== 脾虚相关实体抽取系统 ===")
    
    # 抽取中医脾虚相关实体
    chinese_spleen_entities = extract_spleen_related_entities(CHINESE_INPUT_JSON, "chinese")
    
    # 抽取西医脾虚相关实体
    western_spleen_entities = extract_spleen_related_entities(WESTERN_INPUT_JSON, "western")
    
    # 合并所有实体
    all_spleen_entities = chinese_spleen_entities + western_spleen_entities
    
    # 显示部分结果
    if all_spleen_entities:
        print(f"\n总共找到 {len(all_spleen_entities)} 个脾虚相关实体")
        print(f"其中中医数据: {len(chinese_spleen_entities)} 个")
        print(f"其中西医数据: {len(western_spleen_entities)} 个")
        
        print("\n前10个脾虚相关实体:")
        for i, entity in enumerate(all_spleen_entities[:10]):
            source = entity.get('source', 'unknown')
            print(f"{i+1}. {entity.get('text', '')} [{entity.get('matched_type', '')}] 来源: {source}")
            print(f"   句子: {entity.get('sentence', '')[:50]}...")
            print()
    
    # 保存结果
    save_results(all_spleen_entities, "../输出结果/all_spleen_entities.json")
    
    # 统计信息
    if all_spleen_entities:
        type_counts = {}
        source_counts = {}
        for entity in all_spleen_entities:
            entity_type = entity.get("matched_type", "Unknown")
            source = entity.get("source", "unknown")
            
            type_counts[entity_type] = type_counts.get(entity_type, 0) + 1
            source_counts[source] = source_counts.get(source, 0) + 1
        
        print("实体类型统计:")
        for entity_type, count in type_counts.items():
            print(f"  {entity_type}: {count} 个")
            
        print("\n数据来源统计:")
        for source, count in source_counts.items():
            print(f"  {source}: {count} 个")
    
    print("\n🎉 脾虚相关实体抽取完成！")


if __name__ == "__main__":
    # 切换到脚本所在目录
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    main()