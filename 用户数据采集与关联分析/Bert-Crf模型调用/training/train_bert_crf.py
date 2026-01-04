import torch
import torch.nn as nn
from torch.utils.data import DataLoader, random_split
from transformers import BertModel, BertTokenizer
from tqdm import tqdm
import os
import json
from dataset import BioDataset, create_data_loader
import numpy as np
from sklearn.metrics import classification_report, accuracy_score


class BertCRF(nn.Module):
    """BERT-CRF模型"""
    
    def __init__(self, bert_model_name: str = "hfl/chinese-bert-wwm-ext", num_labels: int = 19):
        """
        初始化BERT-CRF模型
        
        Args:
            bert_model_name: BERT模型名称
            num_labels: 标签数量
        """
        super(BertCRF, self).__init__()
        self.num_labels = num_labels
        
        # BERT模型
        self.bert = BertModel.from_pretrained(bert_model_name)
        
        # dropout层
        self.dropout = nn.Dropout(0.1)
        
        # 分类器
        self.classifier = nn.Linear(self.bert.config.hidden_size, num_labels)
        
        # CRF转移矩阵
        self.transitions = nn.Parameter(torch.randn(num_labels, num_labels))
        
        # 初始化转移矩阵
        nn.init.xavier_uniform_(self.transitions)
        
    def forward(self, input_ids, attention_mask, labels=None):
        """
        前向传播
        
        Args:
            input_ids: 输入IDs
            attention_mask: 注意力掩码
            labels: 标签（训练时提供）
            
        Returns:
            loss或logits
        """
        # BERT编码
        outputs = self.bert(input_ids=input_ids, attention_mask=attention_mask)
        sequence_output = outputs.last_hidden_state
        
        # dropout
        sequence_output = self.dropout(sequence_output)
        
        # 分类
        logits = self.classifier(sequence_output)
        
        if labels is not None:
            # 计算损失
            loss = self.calculate_loss(logits, labels, attention_mask)
            return loss
        else:
            # 预测时返回logits
            return logits
    
    def calculate_loss(self, logits, labels, attention_mask):
        """
        计算损失（负对数似然）
        
        Args:
            logits: 模型输出
            labels: 真实标签
            attention_mask: 注意力掩码
            
        Returns:
            损失值
        """
        # 简化实现：使用交叉熵损失
        # 实际应用中应该实现完整的CRF损失计算
        active_loss = attention_mask.view(-1) == 1
        active_logits = logits.view(-1, self.num_labels)
        active_labels = torch.where(
            active_loss,
            labels.view(-1),
            torch.tensor(0).type_as(labels)
        )
        loss_fct = nn.CrossEntropyLoss()
        loss = loss_fct(active_logits, active_labels)
        return loss


def train_model(train_dataloader: DataLoader, model: BertCRF, 
                optimizer, device: torch.device, epochs: int = 3):
    """
    训练模型
    
    Args:
        train_dataloader: 训练数据加载器
        model: 模型
        optimizer: 优化器
        device: 设备
        epochs: 训练轮数
    """
    model.train()
    
    for epoch in range(epochs):
        total_loss = 0
        progress_bar = tqdm(train_dataloader, desc=f"Epoch {epoch+1}/{epochs}")
        
        for batch in progress_bar:
            # 将数据移到设备上
            input_ids = batch['input_ids'].to(device)
            attention_mask = batch['attention_mask'].to(device)
            labels = batch['labels'].to(device)
            
            # 清零梯度
            optimizer.zero_grad()
            
            # 前向传播
            loss = model(input_ids, attention_mask, labels)
            
            # 反向传播
            loss.backward()
            
            # 更新参数
            optimizer.step()
            
            # 累计损失
            total_loss += loss.item()
            
            # 更新进度条
            progress_bar.set_postfix({'loss': loss.item()})
        
        avg_loss = total_loss / len(train_dataloader)
        print(f"Epoch {epoch+1}/{epochs} - Average Loss: {avg_loss:.4f}")


def evaluate_model(val_dataloader: DataLoader, model: BertCRF, device: torch.device):
    """
    评估模型
    
    Args:
        val_dataloader: 验证数据加载器
        model: 模型
        device: 设备
        
    Returns:
        准确率和分类报告
    """
    model.eval()
    all_preds = []
    all_labels = []
    
    with torch.no_grad():
        for batch in tqdm(val_dataloader, desc="Evaluating"):
            input_ids = batch['input_ids'].to(device)
            attention_mask = batch['attention_mask'].to(device)
            labels = batch['labels'].to(device)
            
            # 前向传播
            logits = model(input_ids, attention_mask)
            
            # 获取预测结果
            preds = torch.argmax(logits, dim=-1)
            
            # 收集预测和真实标签
            all_preds.extend(preds.cpu().numpy().flatten())
            all_labels.extend(labels.cpu().numpy().flatten())
    
    # 过滤掉填充的标签
    filtered_preds = []
    filtered_labels = []
    for pred, label in zip(all_preds, all_labels):
        if label != 0:  # 0是填充标签
            filtered_preds.append(pred)
            filtered_labels.append(label)
    
    # 计算准确率
    accuracy = accuracy_score(filtered_labels, filtered_preds)
    
    # 生成分类报告
    report = classification_report(filtered_labels, filtered_preds, zero_division=0)
    
    return accuracy, report


def save_model(model: BertCRF, tokenizer: BertTokenizer, save_path: str):
    """
    保存模型
    
    Args:
        model: 模型
        tokenizer: 分词器
        save_path: 保存路径
    """
    os.makedirs(save_path, exist_ok=True)
    
    # 保存模型权重
    torch.save(model.state_dict(), os.path.join(save_path, "bert_crf_spleen.pth"))
    
    # 保存分词器
    tokenizer.save_pretrained(save_path)
    
    print(f"模型已保存到: {save_path}")


def main():
    """主函数"""
    print("=== BERT-CRF 医学实体识别模型训练 ===")
    
    # 设置设备
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"使用设备: {device}")
    
    # 初始化分词器
    print("正在加载BERT分词器...")
    tokenizer = BertTokenizer.from_pretrained("hfl/chinese-bert-wwm-ext")
    
    # 创建完整数据集
    print("正在加载数据集...")
    full_dataset = BioDataset("./输出结果/train_chinese.bio", tokenizer, max_length=128)
    
    # 划分训练集和验证集
    train_size = int(0.8 * len(full_dataset))
    val_size = len(full_dataset) - train_size
    train_dataset, val_dataset = random_split(full_dataset, [train_size, val_size])
    
    print(f"训练集大小: {len(train_dataset)}")
    print(f"验证集大小: {len(val_dataset)}")
    
    # 创建数据加载器
    print("正在创建数据加载器...")
    train_dataloader = DataLoader(train_dataset, batch_size=8, shuffle=True)
    val_dataloader = DataLoader(val_dataset, batch_size=8, shuffle=False)
    
    # 初始化模型
    print("正在初始化模型...")
    model = BertCRF(bert_model_name="hfl/chinese-bert-wwm-ext", num_labels=19)
    model.to(device)
    
    # 初始化优化器
    optimizer = torch.optim.AdamW(model.parameters(), lr=2e-5)
    
    # 训练模型
    print("开始训练模型...")
    train_model(train_dataloader, model, optimizer, device, epochs=3)
    
    # 评估模型
    print("正在评估模型...")
    accuracy, report = evaluate_model(val_dataloader, model, device)
    print(f"验证集准确率: {accuracy:.4f}")
    print("分类报告:")
    print(report)
    
    # 保存模型
    print("正在保存模型...")
    save_model(model, tokenizer, "./models/bert_crf_medical_ner")
    
    print("✅ 训练完成！")


if __name__ == "__main__":
    main()