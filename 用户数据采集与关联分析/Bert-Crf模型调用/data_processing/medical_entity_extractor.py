import os
import re
import json
from typing import List, Dict, Tuple
from collections import defaultdict
import torch
from transformers import BertTokenizer, BertModel
from sklearn_crfsuite import CRF
import jieba
import jieba.posseg as pseg

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

class MedicalEntityExtractor:
    def __init__(self, bert_model_path="hfl/chinese-bert-wwm-ext"):
        """
        初始化医学实体抽取器
        """
        self.bert_model_path = bert_model_path
        self.tokenizer = None
        self.model = None
        self.crf_model = None
        self._load_bert_model()
        
    def _load_bert_model(self):
        """
        加载BERT模型和分词器
        """
        try:
            print("正在加载BERT模型...")
            self.tokenizer = BertTokenizer.from_pretrained(self.bert_model_path)
            self.model = BertModel.from_pretrained(self.bert_model_path)
            print("✅ BERT模型加载成功！")
        except Exception as e:
            print(f"❌ BERT模型加载失败: {e}")
            
    def load_crf_model(self, model_path):
        """
        加载训练好的CRF模型
        """
        try:
            import joblib
            self.crf_model = joblib.load(model_path)
            print("✅ CRF模型加载成功！")
        except Exception as e:
            print(f"❌ CRF模型加载失败: {e}")
            
    def read_text_files(self, data_dir: str) -> List[Tuple[str, str]]:
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
    
    def preprocess_text(self, text: str) -> List[str]:
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
    
    def extract_entities_simple(self, text: str) -> List[Dict]:
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
        disease_keywords = ['胃炎', '胃溃疡', '肠炎', '肺炎', '肝炎', '肾炎', '心律不齐']
        symptom_keywords = ['疼痛', '发热', '咳嗽', '呕吐', '腹泻', '头晕', '乏力']
        medicine_keywords = ['阿莫西林', '奥美拉唑', '头孢', '青霉素']
        herb_keywords = ['党参', '白术', '茯苓', '甘草', '当归', '川芎', '白芍']
        formula_keywords = ['四君子汤', '六味地黄丸', '补中益气汤', '逍遥散']
        syndrome_keywords = ['脾气虚', '肾阳虚', '肝郁', '血瘀', '痰湿']
        
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
    
    def process_single_text(self, text: str, filename: str = "") -> List[Tuple[str, List[Dict]]]:
        """
        处理单个文本文件，将其分割成句子并抽取实体
        
        Args:
            text: 输入文本
            filename: 文件名（用于日志）
            
        Returns:
            [(sentence, entities), ...]
        """
        print(f"正在处理文本: {filename}")
        sentences = self.preprocess_text(text)
        results = []
        
        for i, sentence in enumerate(sentences):
            if len(sentence) > 2:  # 过滤太短的句子
                entities = self.extract_entities_simple(sentence)
                results.append((sentence, entities))
                
        print(f"从 {filename} 中提取了 {len(results)} 个句子")
        return results
    
    def process_all_texts(self, data_dirs: List[str]) -> List[Tuple[str, List[Dict]]]:
        """
        处理所有文本数据
        
        Args:
            data_dirs: 数据目录列表
            
        Returns:
            [(sentence, entities), ...]
        """
        all_results = []
        
        for data_dir in data_dirs:
            texts = self.read_text_files(data_dir)
            for filename, content in texts:
                results = self.process_single_text(content, filename)
                all_results.extend(results)
                
        print(f"总共处理了 {len(all_results)} 个句子")
        return all_results
    
    def generate_bio_format(self, sentences_with_entities: List[Tuple[str, List[Dict]]], 
                           output_path: str):
        """
        生成BIO格式的标注文件
        
        Args:
            sentences_with_entities: [(sentence, entities), ...]
            output_path: 输出文件路径
        """
        print("正在生成BIO格式文件...")
        try:
            write_bio_file(sentences_with_entities, output_path, 
                         label_types=set(MEDICAL_ENTITY_TYPES.keys()))
            print(f"✅ BIO格式文件已生成: {output_path}")
        except Exception as e:
            print(f"❌ 生成BIO文件失败: {e}")
    
    def extract_with_bert(self, text: str) -> List[Dict]:
        """
        使用BERT模型进行实体抽取
        
        Args:
            text: 输入文本
            
        Returns:
            实体列表
        """
        if self.model is None or self.tokenizer is None:
            print("❌ BERT模型未加载")
            return []
            
        try:
            # 对文本进行编码
            inputs = self.tokenizer(text, return_tensors="pt", 
                                  padding=True, truncation=True, max_length=512)
            
            # 获取BERT输出
            with torch.no_grad():
                outputs = self.model(**inputs)
                hidden_states = outputs.last_hidden_state
                
            # 这里应该使用CRF或其他解码器来预测标签
            # 由于这是一个简化版本，我们返回简单规则匹配的结果
            entities = self.extract_entities_simple(text)
            return entities
            
        except Exception as e:
            print(f"❌ 使用BERT抽取实体时出错: {e}")
            return []

def main():
    """
    主函数
    """
    print("=== 医学实体抽取系统 ===")
    
    # 初始化实体抽取器
    extractor = MedicalEntityExtractor()
    
    # 定义数据目录
    data_dirs = [
        "../数据清洗/Data_ChineseMedicineScience",
        "../数据清洗/Data_WesternMedicine"
    ]
    
    # 处理所有文本数据
    print("开始处理文本数据...")
    sentences_with_entities = extractor.process_all_texts(data_dirs)
    
    # 生成BIO格式文件
    bio_output_path = "../train.bio"
    extractor.generate_bio_format(sentences_with_entities, bio_output_path)
    
    # 如果需要使用BERT模型进行实体抽取
    if sentences_with_entities:
        print("\n=== 使用BERT模型进行实体抽取示例 ===")
        sample_sentence = sentences_with_entities[0][0]  # 取第一个句子作为示例
        print(f"示例句子: {sample_sentence}")
        
        entities = extractor.extract_with_bert(sample_sentence)
        print("抽取的实体:")
        for entity in entities:
            print(f"  - {entity['text']} ({MEDICAL_ENTITY_TYPES.get(entity['type'], entity['type'])})")
    
    print("\n✅ 处理完成！")

if __name__ == "__main__":
    main()