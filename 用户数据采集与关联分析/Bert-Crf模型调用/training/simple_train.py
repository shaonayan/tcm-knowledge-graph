import torch
import torch.nn as nn
from torch.utils.data import DataLoader, random_split
from transformers import BertModel, BertTokenizer
from tqdm import tqdm
import os
from dataset import BioDataset


class SimpleBertNER(nn.Module):
    """简化版BERT-NER模型"""
    
    def __init__(self, bert_model_name: str = "hfl/chinese-bert-wwm-ext", num_labels: int = 19):
        """
        初始化模型
        
        Args:
            bert_model_name: BERT模型名称
            num_labels: 标签数量
        """
        super(SimpleBertNER, self).__init__()
        self.num_labels = num_labels
        
        # BERT模型
        self.bert = BertModel.from_pretrained(bert_model_name)
        
        # dropout层
        self.dropout = nn.Dropout(0.1)
        
        # 分类器
        self.classifier = nn.Linear(self.bert.config.hidden_size, num_labels)
        
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
        计算损失
        
        Args:
            logits: 模型输出
            labels: 真实标签
            attention_mask: 注意力掩码
            
        Returns:
            损失值
        """
        # 使用交叉熵损失
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


def train_model(train_dataloader: DataLoader, model, optimizer, device: torch.device, epochs: int = 3):
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


def save_model(model, tokenizer, save_path: str):
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
    print("=== 简化版BERT-NER医学实体识别模型训练 ===")
    
    # 设置设备
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"使用设备: {device}")
    
    # 检查是否有GPU可用
    if torch.cuda.is_available():
        print(f"GPU型号: {torch.cuda.get_device_name(0)}")
        print(f"GPU内存: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
    
    # 初始化分词器
    print("正在加载BERT分词器...")
    try:
        tokenizer = BertTokenizer.from_pretrained("hfl/chinese-bert-wwm-ext")
        print("✅ BERT分词器加载成功！")
    except Exception as e:
        print(f"❌ BERT分词器加载失败: {e}")
        print("请确保已下载BERT模型或网络连接正常")
        return
    
    # 创建完整数据集
    print("正在加载数据集...")
    try:
        full_dataset = BioDataset("./输出结果/train_chinese.bio", tokenizer, max_length=128)
        print(f"✅ 数据集加载成功，共 {len(full_dataset)} 个样本")
    except Exception as e:
        print(f"❌ 数据集加载失败: {e}")
        print("请确保BIO文件存在且格式正确")
        return
    
    # 检查数据集是否为空
    if len(full_dataset) == 0:
        print("❌ 数据集为空，请检查BIO文件")
        return
    
    # 划分训练集和验证集
    train_size = int(0.8 * len(full_dataset))
    val_size = len(full_dataset) - train_size
    
    # 确保至少有一个验证样本
    if val_size == 0 and len(full_dataset) > 1:
        val_size = 1
        train_size = len(full_dataset) - val_size
    
    if train_size == 0:
        print("❌ 数据集太小，无法划分训练集和验证集")
        return
        
    train_dataset, val_dataset = random_split(full_dataset, [train_size, val_size])
    
    print(f"训练集大小: {len(train_dataset)}")
    print(f"验证集大小: {len(val_dataset)}")
    
    # 创建数据加载器
    print("正在创建数据加载器...")
    train_dataloader = DataLoader(train_dataset, batch_size=4, shuffle=True)  # 减小batch_size
    val_dataloader = DataLoader(val_dataset, batch_size=4, shuffle=False)
    
    # 初始化模型
    print("正在初始化模型...")
    model = SimpleBertNER(bert_model_name="hfl/chinese-bert-wwm-ext", num_labels=19)
    model.to(device)
    print("✅ 模型初始化完成！")
    
    # 初始化优化器
    optimizer = torch.optim.AdamW(model.parameters(), lr=2e-5)
    
    # 训练模型
    print("开始训练模型...")
    try:
        train_model(train_dataloader, model, optimizer, device, epochs=2)  # 减少训练轮数
        print("✅ 模型训练完成！")
    except Exception as e:
        print(f"❌ 模型训练失败: {e}")
        return
    
    # 保存模型
    print("正在保存模型...")
    try:
        save_model(model, tokenizer, "./models")
        print("✅ 模型保存完成！")
    except Exception as e:
        print(f"❌ 模型保存失败: {e}")
        return
    
    print("\n🎉 训练流程完成！")
    print("模型已保存到 ./models/bert_crf_spleen.pth")


if __name__ == "__main__":
    main()