#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
医学疾病名词提取工具
用于从医学疾病名词PDF文件中提取所有中文疾病名称（包括主名和别名）
"""

import os
import re
import sys
import pdfplumber
from PIL import Image

# 尝试导入pytesseract，如果失败则设置为None
try:
    import pytesseract
except ImportError:
    pytesseract = None


def extract_text_from_image(image):
    """
    使用OCR从图像中提取文本
    :param image: PIL Image对象
    :return: 提取的文本
    """
    if pytesseract is None:
        print("OCR功能不可用：未安装pytesseract库")
        return None
    
    try:
        # 配置Tesseract参数，使用中文语言包
        custom_config = r'--oem 3 --psm 6 -l chi_sim'
        text = pytesseract.image_to_string(image, config=custom_config)
        return text
    except FileNotFoundError:
        print("OCR识别出错: Tesseract OCR引擎未安装或未配置到系统PATH中")
        print("请参考README.md文件中的安装说明")
        return None
    except Exception as e:
        print(f"OCR识别出错: {e}")
        return None


def extract_disease_names(pdf_path):
    """
    从PDF文件中提取中文疾病名称
    :param pdf_path: PDF文件路径
    :return: 提取的疾病名称集合
    """
    # 定义匹配中文疾病名称的正则表达式
    # 主名: 以中文开头，可能包含数字、字母、空格和标点
    # 别名: 匹配[又称]或[别名]后的中文名称
    chinese_pattern = re.compile(r'[\u4e00-\u9fa5]+[\u4e00-\u9fa5\d\s·\-()]*[\u4e00-\u9fa5\d]')
    alias_pattern = re.compile(r'\[(?:又称|别名)\]([\u4e00-\u9fa5\d\s·\-()，、]+)')
    
    disease_names = set()
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            total_pages = len(pdf.pages)
            print(f"正在处理PDF文件，共{total_pages}页...")
            
            for page_num, page in enumerate(pdf.pages, 1):
                # 首先尝试直接提取文本
                text = page.extract_text()
                
                # 如果直接提取失败，尝试使用OCR
                if not text:
                    if pytesseract is None:
                        print(f"第{page_num}页直接提取失败，OCR功能不可用（未安装pytesseract）")
                    else:
                        print(f"第{page_num}页直接提取失败，尝试OCR识别...")
                        # 将PDF页面转换为图像
                        image = page.to_image(resolution=300)
                        # 使用OCR提取文本
                        text = extract_text_from_image(image.original)
                    
                if not text:
                    continue
                
                # 逐行处理文本
                lines = text.split('\n')
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                        
                    # 提取主名
                    main_matches = chinese_pattern.findall(line)
                    if main_matches:
                        # 取第一个匹配作为主名（通常疾病名称在行首）
                        main_name = main_matches[0].strip()
                        # 去除行首可能的编号（如"1."、"(1)"等）
                        main_name = re.sub(r'^[\d.\s()]+', '', main_name)
                        if main_name:
                            disease_names.add(main_name)
                    
                    # 提取别名
                    alias_match = alias_pattern.search(line)
                    if alias_match:
                        alias_text = alias_match.group(1)
                        # 处理可能包含多个别名的情况（用、或，分隔）
                        aliases = re.split(r'[、，]', alias_text)
                        for alias in aliases:
                            alias = alias.strip()
                            if alias:
                                disease_names.add(alias)
                
                # 显示进度
                if page_num % 10 == 0:
                    print(f"已处理第{page_num}/{total_pages}页")
                    
    except Exception as e:
        print(f"处理PDF文件时出错: {e}")
        return None
    
    return disease_names


def save_to_txt(disease_names, output_path):
    """
    将疾病名称保存到TXT文件
    :param disease_names: 疾病名称集合
    :param output_path: 输出文件路径
    """
    try:
        # 按中文排序
        sorted_names = sorted(disease_names, key=lambda x: x)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            for name in sorted_names:
                f.write(name + '\n')
        
        print(f"成功保存{len(sorted_names)}个疾病名称到文件: {output_path}")
        return True
    except Exception as e:
        print(f"保存文件时出错: {e}")
        return False




if __name__ == "__main__":
    print("=== 医学疾病名词提取工具 ===")
    print("该工具用于从医学疾病名词PDF文件中提取中文疾病名称")
    print("请确保已安装依赖: pip install pdfplumber")
    print()
    
    # 获取PDF路径（支持命令行参数或用户输入）
    if len(sys.argv) > 1:
        pdf_path = sys.argv[1].strip()
    else:
        pdf_path = input("请输入医学疾病名词PDF文件的路径: ").strip()
    
    # 验证PDF文件是否存在
    if not os.path.exists(pdf_path):
        print("错误: 指定的PDF文件不存在！")
        exit(1)
    
    if not pdf_path.lower().endswith('.pdf'):
        print("错误: 请输入PDF格式的文件！")
        exit(1)
    
    print(f"\n正在从文件中提取疾病名称: {os.path.basename(pdf_path)}")
    
    # 提取疾病名称
    disease_names = extract_disease_names(pdf_path)
    if not disease_names:
        print("提取失败，请检查PDF文件格式是否符合要求")
        exit(1)
    
    print(f"\n成功提取到{len(disease_names)}个疾病名称（已去重）")
    
    # 生成输出文件名
    pdf_name = os.path.splitext(os.path.basename(pdf_path))[0]
    output_path = os.path.join(os.path.dirname(pdf_path), f"{pdf_name}_dictionary.txt")
    
    # 保存到TXT文件
    if save_to_txt(disease_names, output_path):
        print("\n=== 处理完成 ===")
        print(f"字典文件已生成: {output_path}")
        print(f"文件格式: 一行一个疾病名称，共{len(disease_names)}个条目")
    else:
        print("\n保存文件失败！")
        exit(1)
