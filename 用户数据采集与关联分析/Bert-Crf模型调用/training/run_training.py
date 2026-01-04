#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
运行BERT-NER模型训练的脚本
"""

import os
import sys
import subprocess


def check_dependencies():
    """检查必要的依赖包是否已安装"""
    print("正在检查依赖包...")
    
    required_packages = [
        "torch",
        "transformers",
        "tqdm",
        "numpy",
        "scikit-learn"
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
            print(f"✅ {package} 已安装")
        except ImportError:
            print(f"❌ {package} 未安装")
            missing_packages.append(package)
    
    # 如果有缺失的包，尝试安装
    if missing_packages:
        print("正在安装缺失的依赖包...")
        try:
            subprocess.check_call([sys.executable, "-m", "pip", "install"] + missing_packages)
            print("✅ 依赖包安装完成")
        except subprocess.CalledProcessError as e:
            print(f"❌ 依赖包安装失败: {e}")
            return False
    
    return True


def main():
    """主函数"""
    print("=== BERT-NER 医学实体识别模型训练启动器 ===")
    
    # 检查依赖
    if not check_dependencies():
        print("依赖包检查失败，无法继续")
        return 1
    
    # 检查数据文件是否存在
    bio_file_path = "./输出结果/train_chinese.bio"
    if not os.path.exists(bio_file_path):
        print(f"❌ BIO文件不存在: {bio_file_path}")
        print("请先运行数据预处理步骤生成BIO文件")
        return 1
    
    # 检查模型文件大小
    file_size = os.path.getsize(bio_file_path)
    file_size_mb = file_size / (1024 * 1024)
    print(f"✅ BIO文件存在，大小: {file_size_mb:.2f} MB")
    
    # 运行训练脚本
    print("正在启动训练...")
    try:
        # 使用simple_train.py进行训练
        subprocess.run([sys.executable, "simple_train.py"], check=True)
        print("✅ 训练完成")
    except subprocess.CalledProcessError as e:
        print(f"❌ 训练过程中出现错误: {e}")
        return 1
    except KeyboardInterrupt:
        print("\n⚠️ 训练被用户中断")
        return 1
    
    print("\n🎉 模型训练流程已完成！")
    return 0


if __name__ == "__main__":
    sys.exit(main())