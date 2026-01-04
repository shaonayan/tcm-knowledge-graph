#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Neo4j 数据模型生成器
将医学知识三元组转换为Neo4j可导入的Cypher语句
"""

import json
import os
from typing import List, Dict, Set, Tuple


class Neo4jDataModelGenerator:
    """Neo4j数据模型生成器"""
    
    def __init__(self):
        """初始化节点类型和关系类型映射"""
        # 节点类型映射（中文 -> 英文标签）
        self.node_types = {
            'Formula': {
                'label': 'Formula',
                'cn_name': '中医方剂',
                'properties': ['name', 'description', 'source']
            },
            'Herb': {
                'label': 'Herb',
                'cn_name': '中药材',
                'properties': ['name', 'description', 'source']
            },
            'Syndrome': {
                'label': 'Syndrome',
                'cn_name': '中医证候',
                'properties': ['name', 'description', 'source']
            },
            'Symptom': {
                'label': 'Symptom',
                'cn_name': '症状',
                'properties': ['name', 'description', 'source']
            },
            'Disease': {
                'label': 'Disease',
                'cn_name': '西医疾病',
                'properties': ['name', 'description', 'source']
            },
            'Medicine': {
                'label': 'Drug',
                'cn_name': '西药',
                'properties': ['name', 'description', 'source']
            },
            'Body_Part': {
                'label': 'BodyPart',
                'cn_name': '身体部位',
                'properties': ['name', 'description']
            },
            'Treatment': {
                'label': 'Treatment',
                'cn_name': '治疗方法',
                'properties': ['name', 'description']
            },
            'Medical_Examination': {
                'label': 'Examination',
                'cn_name': '医学检查',
                'properties': ['name', 'description']
            }
        }
        
        # 关系类型映射（中文 -> 英文关系）
        self.relation_types = {
            '治疗': 'TREATS',
            '包含': 'CONTAINS',
            '对应': 'CORRESPONDS_TO',
            '表现为': 'MANIFESTS_AS',
            '主治': 'TREATS',
            '缓解': 'RELIEVES',
            '功效': 'HAS_EFFECT_ON',
            '配伍': 'COMBINED_WITH',
            '症候表现': 'HAS_SYMPTOM',
            '并发症': 'COMPLICATION_OF',
            '成分': 'HAS_COMPONENT',
            '病因': 'CAUSES',
            '部位': 'LOCATED_AT',
            '适应症': 'INDICATED_FOR',
            '诊断': 'DIAGNOSES',
            '发病部位': 'AFFECTS',
            '治疗方式': 'TREATMENT_METHOD'
        }
        
        # 存储唯一节点和关系
        self.nodes: Dict[str, Set[str]] = {}
        self.relationships: List[Tuple[str, str, str, str]] = []
        
    def load_triples(self, json_file: str, data_source: str = 'chinese'):
        """
        加载三元组JSON文件
        
        Args:
            json_file: 三元组JSON文件路径
            data_source: 数据来源（chinese/western）
        """
        print(f"正在加载三元组文件: {json_file}")
        
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        triples = data.get('triples', [])
        print(f"共加载 {len(triples)} 条三元组")
        
        # 处理每个三元组
        for triple in triples:
            head = triple['head']
            relation = triple['relation']
            tail = triple['tail']
            
            # 推断节点类型（基于关系推断）
            head_type, tail_type = self._infer_node_types(head, tail, relation)
            
            # 添加节点
            self._add_node(head, head_type, data_source)
            self._add_node(tail, tail_type, data_source)
            
            # 添加关系
            self._add_relationship(head, relation, tail, data_source)
    
    def _infer_node_types(self, head: str, tail: str, relation: str) -> Tuple[str, str]:
        """
        根据实体名称和关系推断节点类型
        
        Args:
            head: 头实体
            tail: 尾实体
            relation: 关系
            
        Returns:
            (head_type, tail_type)
        """
        # 基于关系推断类型
        if relation == '包含':
            return 'Formula', 'Herb'
        elif relation == '治疗':
            # 可能是 Herb->Symptom, Formula->Syndrome, Medicine->Disease
            if any(x in head for x in ['汤', '散', '丸', '味地黄丸']):
                return 'Formula', 'Syndrome'
            elif any(x in head for x in ['参', '归', '芪', '术', '苓', '草', '芎', '芍', '夏', '芩', '连', '柴胡', '枸杞']):
                return 'Herb', 'Symptom'
            else:
                return 'Medicine', 'Disease'
        elif relation == '对应':
            return 'Syndrome', 'Disease'
        elif relation == '表现为':
            return 'Disease', 'Symptom'
        elif relation == '主治':
            return 'Formula', 'Disease'
        elif relation == '缓解':
            return 'Medicine', 'Symptom'
        elif relation == '功效':
            return 'Herb', 'Syndrome'
        elif relation == '配伍':
            return 'Herb', 'Herb'
        elif relation == '症候表现':
            return 'Syndrome', 'Symptom'
        elif relation == '并发症':
            return 'Disease', 'Disease'
        elif relation == '成分':
            return 'Medicine', 'Herb'
        else:
            # 默认推断
            return self._guess_type(head), self._guess_type(tail)
    
    def _guess_type(self, entity: str) -> str:
        """根据实体名称猜测类型"""
        if any(x in entity for x in ['汤', '散', '丸', '味地黄丸']):
            return 'Formula'
        elif any(x in entity for x in ['参', '归', '芪', '术', '苓', '草', '芎', '芍', '夏', '芩', '连', '柴胡', '枸杞']):
            return 'Herb'
        elif any(x in entity for x in ['虚', '瘀', '郁', '湿', '阴虚火旺']):
            return 'Syndrome'
        elif any(x in entity for x in ['病', '炎', '癌', '综合征']):
            return 'Disease'
        elif any(x in entity for x in ['痛', '晕', '吐', '泻', '胀', '闷', '力', '眠', '悸', '咳', '热', '汗']):
            return 'Symptom'
        else:
            return 'Disease'  # 默认
    
    def _add_node(self, name: str, node_type: str, source: str):
        """添加节点"""
        if node_type not in self.nodes:
            self.nodes[node_type] = set()
        self.nodes[node_type].add((name, source))
    
    def _add_relationship(self, head: str, relation: str, tail: str, source: str):
        """添加关系"""
        rel_type = self.relation_types.get(relation, relation.upper().replace(' ', '_'))
        self.relationships.append((head, rel_type, tail, source))
    
    def generate_cypher_script(self, output_file: str):
        """
        生成Neo4j Cypher导入脚本
        
        Args:
            output_file: 输出文件路径
        """
        print(f"正在生成Neo4j Cypher脚本: {output_file}")
        
        with open(output_file, 'w', encoding='utf-8') as f:
            # 写入文件头
            f.write("// ========================================\n")
            f.write("// 医学知识图谱 Neo4j 数据模型\n")
            f.write("// 自动生成于中西医实体三元组数据\n")
            f.write("// ========================================\n\n")
            
            # 1. 清空数据库（可选，谨慎使用）
            f.write("// 步骤1: 清空现有数据（可选，生产环境请注释掉）\n")
            f.write("// MATCH (n) DETACH DELETE n;\n\n")
            
            # 2. 创建约束和索引
            f.write("// 步骤2: 创建唯一性约束和索引\n")
            for node_type, info in self.node_types.items():
                label = info['label']
                f.write(f"CREATE CONSTRAINT IF NOT EXISTS FOR (n:{label}) REQUIRE n.name IS UNIQUE;\n")
            f.write("\n")
            
            # 3. 创建节点
            f.write("// 步骤3: 创建节点\n")
            total_nodes = 0
            for node_type, nodes in self.nodes.items():
                if not nodes:
                    continue
                    
                label = self.node_types.get(node_type, {}).get('label', node_type)
                cn_name = self.node_types.get(node_type, {}).get('cn_name', node_type)
                
                f.write(f"\n// {cn_name} ({label}) - {len(nodes)} 个节点\n")
                
                for name, source in sorted(nodes):
                    # 转义单引号
                    safe_name = name.replace("'", "\\'")
                    cypher = f"MERGE (n:{label} {{name: '{safe_name}', source: '{source}'}});\n"
                    f.write(cypher)
                    total_nodes += 1
            
            f.write(f"\n// 总节点数: {total_nodes}\n\n")
            
            # 4. 创建关系
            f.write("// 步骤4: 创建关系\n")
            
            # 按关系类型分组
            rel_groups = {}
            for head, rel_type, tail, source in self.relationships:
                if rel_type not in rel_groups:
                    rel_groups[rel_type] = []
                rel_groups[rel_type].append((head, tail, source))
            
            total_rels = 0
            for rel_type, rels in sorted(rel_groups.items()):
                # 找到中文关系名
                cn_rel = [k for k, v in self.relation_types.items() if v == rel_type]
                cn_rel_name = cn_rel[0] if cn_rel else rel_type
                
                f.write(f"\n// {cn_rel_name} ({rel_type}) - {len(rels)} 条关系\n")
                
                for head, tail, source in sorted(rels):
                    # 转义单引号
                    safe_head = head.replace("'", "\\'")
                    safe_tail = tail.replace("'", "\\'")
                    
                    cypher = (
                        f"MATCH (a {{name: '{safe_head}'}}), (b {{name: '{safe_tail}'}}) "
                        f"MERGE (a)-[r:{rel_type} {{source: '{source}'}}]->(b);\n"
                    )
                    f.write(cypher)
                    total_rels += 1
            
            f.write(f"\n// 总关系数: {total_rels}\n\n")
            
            # 5. 验证查询
            f.write("// 步骤5: 验证查询示例\n")
            f.write("// 查询所有节点类型和数量\n")
            f.write("// MATCH (n) RETURN labels(n) AS NodeType, count(n) AS Count ORDER BY Count DESC;\n\n")
            f.write("// 查询所有关系类型和数量\n")
            f.write("// MATCH ()-[r]->() RETURN type(r) AS RelationType, count(r) AS Count ORDER BY Count DESC;\n\n")
            f.write("// 查询特定方剂的完整信息\n")
            f.write("// MATCH (f:Formula {name: '六味地黄丸'})-[r]-(n) RETURN f, r, n LIMIT 50;\n\n")
            
        print(f"✅ Cypher脚本已生成: {output_file}")
        print(f"  - 节点数: {total_nodes}")
        print(f"  - 关系数: {total_rels}")
        print(f"  - 关系类型数: {len(rel_groups)}")
    
    def generate_statistics(self, output_file: str):
        """
        生成数据统计报告
        
        Args:
            output_file: 输出文件路径
        """
        print(f"正在生成统计报告: {output_file}")
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write("# 医学知识图谱数据统计报告\n\n")
            
            # 节点统计
            f.write("## 节点统计\n\n")
            f.write("| 节点类型 | 中文名称 | 节点数量 |\n")
            f.write("|---------|---------|----------|\n")
            
            total_nodes = 0
            for node_type, nodes in sorted(self.nodes.items(), key=lambda x: len(x[1]), reverse=True):
                cn_name = self.node_types.get(node_type, {}).get('cn_name', node_type)
                count = len(nodes)
                total_nodes += count
                f.write(f"| {node_type} | {cn_name} | {count} |\n")
            
            f.write(f"| **总计** | - | **{total_nodes}** |\n\n")
            
            # 关系统计
            f.write("## 关系统计\n\n")
            f.write("| 关系类型 | 中文名称 | 关系数量 | 示例 |\n")
            f.write("|---------|---------|----------|------|\n")
            
            # 统计关系
            rel_stats = {}
            for head, rel_type, tail, source in self.relationships:
                if rel_type not in rel_stats:
                    rel_stats[rel_type] = {'count': 0, 'examples': []}
                rel_stats[rel_type]['count'] += 1
                if len(rel_stats[rel_type]['examples']) < 3:
                    rel_stats[rel_type]['examples'].append(f"{head}->{tail}")
            
            total_rels = 0
            for rel_type, stats in sorted(rel_stats.items(), key=lambda x: x[1]['count'], reverse=True):
                cn_rel = [k for k, v in self.relation_types.items() if v == rel_type]
                cn_rel_name = cn_rel[0] if cn_rel else rel_type
                count = stats['count']
                example = ", ".join(stats['examples'][:2])
                total_rels += count
                f.write(f"| {rel_type} | {cn_rel_name} | {count} | {example} |\n")
            
            f.write(f"| **总计** | - | **{total_rels}** | - |\n\n")
            
            # 数据源统计
            f.write("## 数据源统计\n\n")
            chinese_count = sum(1 for _, _, _, s in self.relationships if s == 'chinese')
            western_count = sum(1 for _, _, _, s in self.relationships if s == 'western')
            f.write(f"- 中医数据: {chinese_count} 条关系\n")
            f.write(f"- 西医数据: {western_count} 条关系\n\n")
        
        print(f"✅ 统计报告已生成: {output_file}")


def main():
    """主函数"""
    print("=== Neo4j 数据模型生成器 ===\n")
    
    # 初始化生成器
    generator = Neo4jDataModelGenerator()
    
    # 加载中医三元组
    chinese_triples_file = "../输出结果/chinese_triples.json"
    if os.path.exists(chinese_triples_file):
        generator.load_triples(chinese_triples_file, 'chinese')
    
    # 加载西医三元组
    western_triples_file = "../输出结果/western_triples.json"
    if os.path.exists(western_triples_file):
        generator.load_triples(western_triples_file, 'western')
    
    # 生成Cypher脚本
    cypher_output = "../输出结果/neo4j_import.cypher"
    generator.generate_cypher_script(cypher_output)
    
    # 生成统计报告
    stats_output = "../输出结果/data_model_statistics.md"
    generator.generate_statistics(stats_output)
    
    print("\n🎉 Neo4j数据模型生成完成！")
    print(f"\n📁 输出文件:")
    print(f"  1. Cypher导入脚本: {cypher_output}")
    print(f"  2. 数据统计报告: {stats_output}")
    print(f"\n💡 使用方法:")
    print(f"  1. 打开Neo4j Browser")
    print(f"  2. 复制 {cypher_output} 中的Cypher语句")
    print(f"  3. 在Neo4j Browser中执行即可导入数据")


if __name__ == "__main__":
    # 切换到脚本所在目录
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    main()
