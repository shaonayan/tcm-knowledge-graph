import torch
from torch.utils.data import Dataset, DataLoader
from transformers import BertTokenizer
from typing import List, Tuple, Dict
import os


class BioDataset(Dataset):
    """BIO格式数据集类"""
    
    def __init__(self, bio_file_path: str, tokenizer: BertTokenizer, max_length: int = 128):
        """
        初始化数据集
        
        Args:
            bio_file_path: BIO格式文件路径
            tokenizer: BERT分词器
            max_length: 序列最大长度
        """
        self.tokenizer = tokenizer
        self.max_length = max_length
        self.sentences = []
        self.labels = []
        
        # 定义标签到ID的映射
        self.label2id = {
            'O': 0,
            'B-Disease': 1, 'I-Disease': 2,
            'B-Symptom': 3, 'I-Symptom': 4,
            'B-Medicine': 5, 'I-Medicine': 6,
            'B-Herb': 7, 'I-Herb': 8,
            'B-Formula': 9, 'I-Formula': 10,
            'B-Syndrome': 11, 'I-Syndrome': 12,
            'B-Body_Part': 13, 'I-Body_Part': 14,
            'B-Medical_Examination': 15, 'I-Medical_Examination': 16,
            'B-Treatment': 17, 'I-Treatment': 18
        }
        
        self.id2label = {v: k for k, v in self.label2id.items()}
        
        # 读取并处理BIO文件
        self._load_bio_file(bio_file_path)
        
    def _load_bio_file(self, bio_file_path: str):
        """加载并处理BIO格式文件"""
        print(f"正在加载BIO文件: {bio_file_path}")
        
        current_sentence = []
        current_labels = []
        
        with open(bio_file_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:  # 空行表示句子结束
                    if current_sentence:
                        # 添加句子和标签
                        self.sentences.append(current_sentence)
                        self.labels.append(current_labels)
                        # 重置
                        current_sentence = []
                        current_labels = []
                else:
                    parts = line.split('\t')
                    if len(parts) == 2:
                        char, label = parts
                        current_sentence.append(char)
                        current_labels.append(label)
        
        # 处理最后一个句子（如果没有以空行结尾）
        if current_sentence:
            self.sentences.append(current_sentence)
            self.labels.append(current_labels)
            
        print(f"加载了 {len(self.sentences)} 个句子")

    def __len__(self):
        """返回数据集大小"""
        return len(self.sentences)
    
    def __getitem__(self, idx):
        """获取单个样本"""
        sentence = self.sentences[idx]
        labels = self.labels[idx]
        
        # 将句子转换为字符串
        text = ''.join(sentence)
        
        # 使用BERT分词器编码
        encoding = self.tokenizer(
            text,
            truncation=True,
            padding='max_length',
            max_length=self.max_length,
            return_tensors='pt'
        )
        
        # 处理标签（需要与分词器的token对应）
        # 这是一个简化的处理方式，实际应用中需要更精确的标签对齐
        label_ids = [self.label2id.get(label, 0) for label in labels]
        
        # 截断或填充标签序列到max_length-2（为[CLS]和[SEP]留空间）
        if len(label_ids) > self.max_length - 2:
            label_ids = label_ids[:self.max_length - 2]
        
        # 添加[CLS]和[SEP]标签（通常为O，对应ID 0）
        label_ids = [0] + label_ids + [0]
        
        # 填充到最大长度
        while len(label_ids) < self.max_length:
            label_ids.append(0)  # 0对应'O'
            
        # 确保长度正确
        if len(label_ids) > self.max_length:
            label_ids = label_ids[:self.max_length]
            
        return {
            'input_ids': encoding['input_ids'].flatten(),
            'attention_mask': encoding['attention_mask'].flatten(),
            'labels': torch.tensor(label_ids, dtype=torch.long)
        }


def create_data_loader(bio_file_path: str, tokenizer: BertTokenizer, 
                      batch_size: int = 16, max_length: int = 128, 
                      shuffle: bool = True) -> DataLoader:
    """
    创建数据加载器
    
    Args:
        bio_file_path: BIO格式文件路径
        tokenizer: BERT分词器
        batch_size: 批次大小
        max_length: 序列最大长度
        shuffle: 是否打乱数据
        
    Returns:
        DataLoader对象
    """
    dataset = BioDataset(bio_file_path, tokenizer, max_length)
    return DataLoader(dataset, batch_size=batch_size, shuffle=shuffle)


# 测试代码
if __name__ == "__main__":
    # 测试数据集类
    from transformers import BertTokenizer
    
    # 初始化分词器
    tokenizer = BertTokenizer.from_pretrained("hfl/chinese-bert-wwm-ext")
    
    # 创建数据集
    dataset = BioDataset("./输出结果/train_chinese.bio", tokenizer, max_length=128)
    
    print(f"数据集大小: {len(dataset)}")
    
    # 查看一个样本
    if len(dataset) > 0:
        sample = dataset[0]
        print("样本输入IDs形状:", sample['input_ids'].shape)
        print("样本注意力掩码形状:", sample['attention_mask'].shape)
        print("样本标签形状:", sample['labels'].shape)
        print("样本标签:", sample['labels'][:10])  # 显示前10个标签