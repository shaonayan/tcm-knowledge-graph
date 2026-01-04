#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
三元组抽取器
将医学实体JSON数据转换为三元组格式
基于规则和模板进行关系抽取
"""

import json
import os
import re
from typing import List, Tuple, Dict, Set


class TripleExtractor:
    """三元组抽取器类"""
    
    def __init__(self):
        """初始化三元组抽取规则"""
        # 定义关系抽取规则和模板（基于联网搜索的医学知识图谱构建规则）
        self.rules = [
            # 规则1: [Formula] + (治/用于/治疗) + [Syndrome]
            {
                'pattern': r'(.+?)(治|用于|治疗)(.+?)(证|症)',
                'entity_types': [('Formula', 0), ('Syndrome', 2)],
                'relation': '治疗',
                'template': '{entity1} {relation} {entity2}'
            },
            # 规则2: [Formula] + 含有 + [Herb]
            {
                'pattern': r'(.+?)(含有|包含|组成|配伍)(.+)',
                'entity_types': [('Formula', 0), ('Herb', 2)],
                'relation': '包含',
                'template': '{entity1} {relation} {entity2}'
            },
            # 规则3: [Herb] + 治疗 + [Symptom]
            {
                'pattern': r'(.+?)(治疗|缓解|改善)(.+)',
                'entity_types': [('Herb', 0), ('Symptom', 2)],
                'relation': '治疗',
                'template': '{entity1} {relation} {entity2}'
            },
            # 规则4: [Syndrome] + 对应 + [Disease]
            {
                'pattern': r'(.+?)(对应|导致|引起)(.+)',
                'entity_types': [('Syndrome', 0), ('Disease', 2)],
                'relation': '对应',
                'template': '{entity1} {relation} {entity2}'
            },
            # 规则5: [Disease] + 表现为 + [Symptom]
            {
                'pattern': r'(.+?)(表现为|症见|症状为)(.+)',
                'entity_types': [('Disease', 0), ('Symptom', 2)],
                'relation': '表现为',
                'template': '{entity1} {relation} {entity2}'
            },
            # 规则6: [Formula] + 主治 + [Disease]
            {
                'pattern': r'(.+?)(主治|用于|适用于)(.+)',
                'entity_types': [('Formula', 0), ('Disease', 2)],
                'relation': '主治',
                'template': '{entity1} {relation} {entity2}'
            },
            # 新增规则7: [Herb] + 功效 + [Syndrome]
            {
                'pattern': r'(.+?)(具有|可|能够|有助于|擅长)(.+)',
                'entity_types': [('Herb', 0), ('Syndrome', 2)],
                'relation': '功效',
                'template': '{entity1} {relation} {entity2}'
            },
            # 新增规则8: [Disease] + 病因 + [Syndrome]
            {
                'pattern': r'(.+?)(由于|因|源于|由)(.+?)(引起|导致|造成)',
                'entity_types': [('Disease', 0), ('Syndrome', 2)],
                'relation': '病因',
                'template': '{entity1} {relation} {entity2}'
            },
            # 新增规则9: [Symptom] + 部位 + [Body_Part]
            {
                'pattern': r'(.+?)(位于|发生在|出现在)(.+)',
                'entity_types': [('Symptom', 0), ('Body_Part', 2)],
                'relation': '部位',
                'template': '{entity1} {relation} {entity2}'
            },
            # 新增规则10: [Treatment] + 用于 + [Disease]
            {
                'pattern': r'(.+?)(用于|适用于|针对)(.+?)(治疗|处理)',
                'entity_types': [('Treatment', 0), ('Disease', 2)],
                'relation': '适应症',
                'template': '{entity1} {relation} {entity2}'
            },
            # 新增规则11: [Medical_Examination] + 检查 + [Disease]
            {
                'pattern': r'(.+?)(检查|诊断|确诊)(.+)',
                'entity_types': [('Medical_Examination', 0), ('Disease', 2)],
                'relation': '诊断',
                'template': '{entity1} {relation} {entity2}'
            },
            # 新增规则12: [Herb] + 配伍 + [Herb]
            {
                'pattern': r'(.+?)(配伍|搭配|联用|合用)(.+)',
                'entity_types': [('Herb', 0), ('Herb', 2)],
                'relation': '配伍',
                'template': '{entity1} {relation} {entity2}'
            },
            # 新增规则13: [Medicine] + 成分 + [Herb]
            {
                'pattern': r'(.+?)(含有|包含|成分)(.+)',
                'entity_types': [('Medicine', 0), ('Herb', 2)],
                'relation': '成分',
                'template': '{entity1} {relation} {entity2}'
            },
            # 新增规则14: [Disease] + 并发症 + [Disease]
            {
                'pattern': r'(.+?)(并发|合并|伴有)(.+)',
                'entity_types': [('Disease', 0), ('Disease', 2)],
                'relation': '并发症',
                'template': '{entity1} {relation} {entity2}'
            },
            # 新增规则15: [Syndrome] + 症候表现 + [Symptom]
            {
                'pattern': r'(.+?)(见|可见|常见|伴有)(.+)',
                'entity_types': [('Syndrome', 0), ('Symptom', 2)],
                'relation': '症候表现',
                'template': '{entity1} {relation} {entity2}'
            },
        ]
        
        # 存储三元组
        self.triples: Set[Tuple[str, str, str]] = set()
        
    def extract_from_sentence(self, sentence: str, entities: List[Dict]) -> List[Tuple[str, str, str]]:
        """
        从句子和实体列表中提取三元组
        
        Args:
            sentence: 句子文本
            entities: 实体列表
            
        Returns:
            三元组列表 [(实体1, 关系, 实体2), ...]
        """
        triples = []
        
        # 创建实体字典，按类型分组
        entity_dict = {}
        for entity in entities:
            entity_type = entity.get('type', '')
            entity_text = entity.get('text', '')
            if entity_type not in entity_dict:
                entity_dict[entity_type] = []
            if entity_text not in entity_dict[entity_type]:
                entity_dict[entity_type].append(entity_text)
        
        # 方法1: 基于共现关系
        triples.extend(self._extract_by_cooccurrence(entity_dict))
        
        # 方法2: 基于句子模式匹配
        triples.extend(self._extract_by_pattern(sentence, entity_dict))
        
        return triples
    
    def _extract_by_cooccurrence(self, entity_dict: Dict[str, List[str]]) -> List[Tuple[str, str, str]]:
        """
        基于共现关系提取三元组
        
        Args:
            entity_dict: 实体字典
            
        Returns:
            三元组列表
        """
        triples = []
        
        # Formula + Syndrome (方剂治疗证候)
        if 'Formula' in entity_dict and 'Syndrome' in entity_dict:
            for formula in entity_dict['Formula']:
                for syndrome in entity_dict['Syndrome']:
                    triples.append((formula, '治疗', syndrome))
        
        # Formula + Herb (方剂包含中药)
        if 'Formula' in entity_dict and 'Herb' in entity_dict:
            for formula in entity_dict['Formula']:
                for herb in entity_dict['Herb']:
                    triples.append((formula, '包含', herb))
        
        # Herb + Symptom (中药治疗症状)
        if 'Herb' in entity_dict and 'Symptom' in entity_dict:
            for herb in entity_dict['Herb']:
                for symptom in entity_dict['Symptom']:
                    triples.append((herb, '治疗', symptom))
        
        # Syndrome + Disease (证候对应疾病)
        if 'Syndrome' in entity_dict and 'Disease' in entity_dict:
            for syndrome in entity_dict['Syndrome']:
                for disease in entity_dict['Disease']:
                    triples.append((syndrome, '对应', disease))
        
        # Disease + Symptom (疾病表现症状)
        if 'Disease' in entity_dict and 'Symptom' in entity_dict:
            for disease in entity_dict['Disease']:
                for symptom in entity_dict['Symptom']:
                    triples.append((disease, '表现为', symptom))
        
        # Formula + Disease (方剂主治疾病)
        if 'Formula' in entity_dict and 'Disease' in entity_dict:
            for formula in entity_dict['Formula']:
                for disease in entity_dict['Disease']:
                    triples.append((formula, '主治', disease))
        
        # Medicine + Disease (药物治疗疾病)
        if 'Medicine' in entity_dict and 'Disease' in entity_dict:
            for medicine in entity_dict['Medicine']:
                for disease in entity_dict['Disease']:
                    triples.append((medicine, '治疗', disease))
        
        # Medicine + Symptom (药物治疗症状)
        if 'Medicine' in entity_dict and 'Symptom' in entity_dict:
            for medicine in entity_dict['Medicine']:
                for symptom in entity_dict['Symptom']:
                    triples.append((medicine, '缓解', symptom))
        
        # 新增: Herb + Syndrome (中药功效)
        if 'Herb' in entity_dict and 'Syndrome' in entity_dict:
            for herb in entity_dict['Herb']:
                for syndrome in entity_dict['Syndrome']:
                    triples.append((herb, '功效', syndrome))
        
        # 新增: Symptom + Body_Part (症状部位)
        if 'Symptom' in entity_dict and 'Body_Part' in entity_dict:
            for symptom in entity_dict['Symptom']:
                for body_part in entity_dict['Body_Part']:
                    triples.append((symptom, '部位', body_part))
        
        # 新增: Treatment + Disease (治疗方法适应症)
        if 'Treatment' in entity_dict and 'Disease' in entity_dict:
            for treatment in entity_dict['Treatment']:
                for disease in entity_dict['Disease']:
                    triples.append((treatment, '适应症', disease))
        
        # 新增: Treatment + Symptom (治疗方法缓解症状)
        if 'Treatment' in entity_dict and 'Symptom' in entity_dict:
            for treatment in entity_dict['Treatment']:
                for symptom in entity_dict['Symptom']:
                    triples.append((treatment, '缓解', symptom))
        
        # 新增: Medical_Examination + Disease (检查诊断疾病)
        if 'Medical_Examination' in entity_dict and 'Disease' in entity_dict:
            for exam in entity_dict['Medical_Examination']:
                for disease in entity_dict['Disease']:
                    triples.append((exam, '诊断', disease))
        
        # 新增: Disease + Body_Part (疾病发病部位)
        if 'Disease' in entity_dict and 'Body_Part' in entity_dict:
            for disease in entity_dict['Disease']:
                for body_part in entity_dict['Body_Part']:
                    triples.append((disease, '发病部位', body_part))
        
        # 新增: Syndrome + Symptom (证候症候表现)
        if 'Syndrome' in entity_dict and 'Symptom' in entity_dict:
            for syndrome in entity_dict['Syndrome']:
                for symptom in entity_dict['Symptom']:
                    triples.append((syndrome, '症候表现', symptom))
        
        # 新增: Medicine + Herb (西药成分)
        if 'Medicine' in entity_dict and 'Herb' in entity_dict:
            for medicine in entity_dict['Medicine']:
                for herb in entity_dict['Herb']:
                    triples.append((medicine, '成分', herb))
        
        # 新增: Formula + Treatment (方剂治疗方法)
        if 'Formula' in entity_dict and 'Treatment' in entity_dict:
            for formula in entity_dict['Formula']:
                for treatment in entity_dict['Treatment']:
                    triples.append((formula, '治疗方式', treatment))
        
        return triples
    
    def _extract_by_pattern(self, sentence: str, entity_dict: Dict[str, List[str]]) -> List[Tuple[str, str, str]]:
        """
        基于句子模式匹配提取三元组
        
        Args:
            sentence: 句子文本
            entity_dict: 实体字典
            
        Returns:
            三元组列表
        """
        triples = []
        
        # 遍历所有规则
        for rule in self.rules:
            pattern = rule['pattern']
            matches = re.finditer(pattern, sentence)
            
            for match in matches:
                # 提取关系
                relation = rule['relation']
                
                # 提取实体
                entity_types = rule['entity_types']
                entities_found = []
                
                for entity_type, group_idx in entity_types:
                    if entity_type in entity_dict:
                        # 检查匹配组中是否包含该类型的实体
                        matched_text = match.group(group_idx + 1) if group_idx + 1 <= len(match.groups()) else ""
                        for entity in entity_dict[entity_type]:
                            if entity in matched_text:
                                entities_found.append(entity)
                                break
                
                # 如果找到了两个实体，生成三元组
                if len(entities_found) >= 2:
                    triples.append((entities_found[0], relation, entities_found[1]))
        
        return triples
    
    def process_json_file(self, json_file_path: str, output_file: str, file_type: str = "chinese"):
        """
        处理JSON文件并生成三元组
        
        Args:
            json_file_path: JSON文件路径
            output_file: 输出文件路径
            file_type: 文件类型
        """
        print(f"正在处理{file_type}医学实体JSON文件: {json_file_path}")
        
        if not os.path.exists(json_file_path):
            print(f"❌ JSON文件不存在: {json_file_path}")
            return
        
        # 读取JSON文件
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # 按句子分组实体
        sentence_entities = {}
        for entity_type, entities in data.items():
            for entity in entities:
                sentence = entity.get('sentence', '')
                if sentence not in sentence_entities:
                    sentence_entities[sentence] = []
                sentence_entities[sentence].append(entity)
        
        print(f"共有 {len(sentence_entities)} 个不同的句子")
        
        # 提取三元组
        all_triples = set()
        for sentence, entities in sentence_entities.items():
            if len(entities) >= 2:  # 至少需要两个实体才能形成关系
                triples = self.extract_from_sentence(sentence, entities)
                all_triples.update(triples)
        
        print(f"✅ 从{file_type}数据中提取了 {len(all_triples)} 个三元组")
        
        # 保存三元组
        self._save_triples(all_triples, output_file, file_type)
        
        return all_triples
    
    def _save_triples(self, triples: Set[Tuple[str, str, str]], output_file: str, file_type: str):
        """
        保存三元组到文件
        
        Args:
            triples: 三元组集合
            output_file: 输出文件路径
            file_type: 文件类型
        """
        print(f"正在保存三元组到: {output_file}")
        
        # 转换为列表并排序
        triples_list = sorted(list(triples), key=lambda x: (x[0], x[1], x[2]))
        
        # 保存为JSON格式
        triples_data = {
            'file_type': file_type,
            'total_count': len(triples_list),
            'triples': [
                {
                    'head': triple[0],
                    'relation': triple[1],
                    'tail': triple[2]
                }
                for triple in triples_list
            ]
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(triples_data, f, ensure_ascii=False, indent=2)
        
        # 同时保存为文本格式，便于查看
        txt_file = output_file.replace('.json', '.txt')
        with open(txt_file, 'w', encoding='utf-8') as f:
            f.write(f"# {file_type}医学知识三元组\n")
            f.write(f"# 总计: {len(triples_list)} 条\n\n")
            for triple in triples_list:
                f.write(f"({triple[0]}, {triple[1]}, {triple[2]})\n")
        
        print(f"✅ 三元组已保存到:")
        print(f"  - JSON格式: {output_file}")
        print(f"  - 文本格式: {txt_file}")


def main():
    """主函数"""
    print("=== 医学知识三元组抽取系统 ===")
    
    # 初始化三元组抽取器
    extractor = TripleExtractor()
    
    # 处理中医数据
    chinese_json = "../输出结果/chinese_entities.json"
    chinese_output = "../输出结果/chinese_triples.json"
    chinese_triples = extractor.process_json_file(chinese_json, chinese_output, "chinese")
    
    # 处理西医数据
    western_json = "../输出结果/western_entities.json"
    western_output = "../输出结果/western_triples.json"
    western_triples = extractor.process_json_file(western_json, western_output, "western")
    
    # 统计信息
    if chinese_triples:
        print(f"\n中医三元组统计:")
        print(f"  总数: {len(chinese_triples)} 条")
        
        # 统计关系类型
        relation_counts = {}
        for triple in chinese_triples:
            relation = triple[1]
            relation_counts[relation] = relation_counts.get(relation, 0) + 1
        
        print("  关系类型分布:")
        for relation, count in sorted(relation_counts.items(), key=lambda x: x[1], reverse=True):
            print(f"    {relation}: {count} 条")
    
    if western_triples:
        print(f"\n西医三元组统计:")
        print(f"  总数: {len(western_triples)} 条")
        
        # 统计关系类型
        relation_counts = {}
        for triple in western_triples:
            relation = triple[1]
            relation_counts[relation] = relation_counts.get(relation, 0) + 1
        
        print("  关系类型分布:")
        for relation, count in sorted(relation_counts.items(), key=lambda x: x[1], reverse=True):
            print(f"    {relation}: {count} 条")
    
    print("\n🎉 三元组抽取完成！")


if __name__ == "__main__":
    # 切换到脚本所在目录
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    main()
