#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
验证生成的BIO文件
"""

import os

def check_bio_file(file_path, file_description):
    """
    检查BIO文件的基本信息
    """
    print(f"\n=== 检查{file_description} ===")
    
    if not os.path.exists(file_path):
        print(f"❌ 文件不存在: {file_path}")
        return
    
    # 获取文件大小
    file_size = os.path.getsize(file_path)
    file_size_mb = file_size / (1024 * 1024)
    
    print(f"文件路径: {file_path}")
    print(f"文件大小: {file_size_mb:.2f} MB")
    
    # 统计行数和标记
    line_count = 0
    tag_count = {}
    
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            line_count += 1
            line = line.strip()
            if line and '\t' in line:
                parts = line.split('\t')
                if len(parts) == 2:
                    _, tag = parts
                    tag_count[tag] = tag_count.get(tag, 0) + 1
    
    print(f"总行数: {line_count}")
    print("标记统计:")
    for tag, count in sorted(tag_count.items()):
        print(f"  {tag}: {count}")
    
    print(f"✅ {file_description}检查完成")

def check_json_file(file_path, file_description):
    """
    检查JSON文件的基本信息
    """
    print(f"\n=== 检查{file_description} ===")
    
    if not os.path.exists(file_path):
        print(f"❌ 文件不存在: {file_path}")
        return
    
    # 获取文件大小
    file_size = os.path.getsize(file_path)
    file_size_mb = file_size / (1024 * 1024)
    
    print(f"文件路径: {file_path}")
    print(f"文件大小: {file_size_mb:.2f} MB")
    
    # 读取并解析JSON文件
    import json
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        total_entities = 0
        print("实体类型统计:")
        for entity_type, entities in data.items():
            count = len(entities)
            total_entities += count
            print(f"  {entity_type}: {count} 个实体")
        
        print(f"总计: {total_entities} 个实体")
        
    except Exception as e:
        print(f"❌ 解析JSON文件时出错: {e}")
        return
    
    print(f"✅ {file_description}检查完成")

def main():
    print("=== 验证生成的BIO文件和结构化实体文件 ===")
    
    output_dir = "./输出结果"
    
    # 检查中医BIO文件
    check_bio_file(os.path.join(output_dir, "train_chinese.bio"), "中医BIO文件")
    
    # 检查西医BIO文件
    check_bio_file(os.path.join(output_dir, "train_western.bio"), "西医BIO文件")
    
    # 检查中医结构化实体文件
    check_json_file(os.path.join(output_dir, "chinese_entities.json"), "中医结构化实体文件")
    
    # 检查西医结构化实体文件
    check_json_file(os.path.join(output_dir, "western_entities.json"), "西医结构化实体文件")
    
    print("\n=== 验证完成 ===")

if __name__ == "__main__":
    main()