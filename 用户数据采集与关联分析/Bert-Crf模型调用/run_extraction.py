#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
运行医学实体抽取的主脚本
"""

import os
import sys
import subprocess

def install_requirements():
    """安装所需的依赖包"""
    print("正在检查并安装依赖包...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ 依赖包安装完成！")
    except subprocess.CalledProcessError as e:
        print(f"❌ 依赖包安装失败: {e}")
        return False
    return True

def run_entity_extraction():
    """运行实体抽取主程序"""
    print("正在运行医学实体抽取程序...")
    try:
        # 添加当前目录到Python路径
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        
        # 导入并运行主程序
        from medical_entity_extractor import main
        main()
        print("✅ 实体抽取程序运行完成！")
    except Exception as e:
        print(f"❌ 运行实体抽取程序时出错: {e}")
        return False
    return True

def main():
    print("=== 医学实体抽取系统启动 ===")
    
    # 安装依赖
    if not install_requirements():
        print("依赖安装失败，程序退出。")
        return
    
    # 运行实体抽取
    if not run_entity_extraction():
        print("实体抽取运行失败，程序退出。")
        return
    
    print("\n=== 所有任务已完成 ===")

if __name__ == "__main__":
    main()