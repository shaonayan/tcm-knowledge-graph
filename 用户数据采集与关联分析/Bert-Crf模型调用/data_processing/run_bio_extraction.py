#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
一键运行医学实体抽取并生成BIO格式文件（分别生成中医和西医文件）
输出结果放置在Bert-Crf模型调用文件夹中的"输出结果"子文件夹中
"""

import os
import sys

def main():
    print("=== 医学实体抽取并生成BIO文件 ===")
    print("分别生成中医和西医的BIO文件")
    print("输出结果放置在 ./输出结果 文件夹中")
    
    # 检查Python版本
    print(f"Python版本: {sys.version}")
    
    try:
        # 导入必要的模块
        from simple_extractor import main as extract_main
        
        print("开始运行实体抽取程序...")
        extract_main()
        
        print("\n✅ BIO文件已生成:")
        print("  - 中医BIO文件: ./输出结果/train_chinese.bio")
        print("  - 西医BIO文件: ./输出结果/train_western.bio")
        print("  - 中医结构化实体: ./输出结果/chinese_entities.json")
        print("  - 西医结构化实体: ./输出结果/western_entities.json")
        
        # 显示生成文件的信息
        output_dir = "./输出结果"
        files = [
            ("train_chinese.bio", "中医BIO"),
            ("train_western.bio", "西医BIO"),
            ("chinese_entities.json", "中医结构化实体"),
            ("western_entities.json", "西医结构化实体")
        ]
        
        for file_name, type_name in files:
            file_path = os.path.join(output_dir, file_name)
            if os.path.exists(file_path):
                # 获取文件大小
                file_size = os.path.getsize(file_path)
                # 转换为MB
                file_size_mb = file_size / (1024 * 1024)
                
                print(f"生成的{type_name}文件大小: {file_size_mb:.2f} MB")
            else:
                print(f"❌ 未找到生成的{type_name}文件: {file_path}")
            
    except ImportError as e:
        print(f"❌ 导入模块失败: {e}")
        print("请确保在正确的目录下运行此脚本")
        return 1
    except Exception as e:
        print(f"❌ 运行过程中发生错误: {e}")
        return 1
    
    print("\n=== 处理完成 ===")
    return 0

if __name__ == "__main__":
    sys.exit(main())