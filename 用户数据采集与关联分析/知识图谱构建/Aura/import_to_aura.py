#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
中医西医知识图谱导入脚本
将中医三元组、西医三元组和中西医映射关系导入到 Neo4j Aura 实例
"""

import json
import os
from py2neo import Graph, Node, Relationship

# ==============================
# 🧠 全局变量和集合
# ==============================
SYNDROME_SET = set()
DISEASE_SET = set()
SYMPTOM_SET = set()
mapping_data = {}


# ==============================
# 🏷️ 标签推断函数
# ==============================
def get_entity_label(entity: str) -> str:
    """
    根据实体名称和映射字典推断标签（Label）
    :param entity: 实体名称
    :return: 实体标签
    """
    entity = entity.strip()
    if not entity:
        return "Entity"
    
    # 优先使用映射字典中的权威分类
    if entity in SYNDROME_SET:
        return "Syndrome"
    if entity in DISEASE_SET:
        return "Disease"
    if entity in SYMPTOM_SET:
        return "Symptom"
    
    # 规则匹配（中药、方剂、西药）
    if any(x in entity for x in ["汤", "丸", "散", "饮", "方"]):
        return "Formula"
    elif any(x in entity for x in [
        "参", "术", "苓", "归", "芪", "草", "夏", "芍", "芎",
        "杞", "柴", "连", "芩", "桂", "附", "姜", "枣"
    ]):
        return "Herb"
    elif any(x in entity for x in ["虚", "郁", "湿", "火旺", "阳虚", "阴虚", "不足", "证"]):
        return "Syndrome"
    elif any(x in entity for x in ["炎", "病", "综合征"]):
        return "Disease"
    elif any(x in entity for x in ["唑", "霉素", "西林", "布洛", "司匹林", "头孢", "青霉素", "奥美", 
                                     "沙星", "替丁", "米松", "他汀", "地平", "西泮", "卡因", "霉素", 
                                     "西汀", "拉唑", "诺酮", "霉素", "苷", "酯"]):
        return "Drug"
    else:
        return "Entity"


def process_triples(graph, triples_file):
    """
    处理三元组数据并导入到 Neo4j
    :param graph: Neo4j 图实例
    :param triples_file: 三元组文件路径
    :return: 导入的三元组数量
    """
    with open(triples_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # 支持不同的JSON数据格式
    triples = []
    if isinstance(data, dict) and "triples" in data:
        triples = data["triples"]
    elif isinstance(data, list):
        triples = data
    else:
        raise ValueError(f"{triples_file} 格式不支持，需为triples列表或包含triples键的字典")
    
    count = 0
    total = len(triples)
    
    # 开始事务
    tx = graph.begin()
    try:
        for i, triple in enumerate(triples):
            # 支持不同的字段命名
            head = triple.get("head") or triple.get("subject", "")
            tail = triple.get("tail") or triple.get("object", "")
            rel = triple.get("relation") or triple.get("predicate", "")
            
            # 忽略无效三元组
            if not head or not tail or not rel:
                continue
            
            subject = head
            predicate = rel
            obj = tail
            
            # 推断实体标签
            subject_label = get_entity_label(subject)
            object_label = get_entity_label(obj)
            
            # 创建或获取节点（使用 merge 避免重复）
            subject_node = Node(subject_label, name=subject)
            tx.merge(subject_node, subject_label, "name")
            
            object_node = Node(object_label, name=obj)
            tx.merge(object_node, object_label, "name")
            
            # 处理关系名（转为大写并标准化特殊字符）
            relationship_type = predicate.upper().replace(" ", "_").replace("-", "_")
            
            # 创建关系
            relationship = Relationship(subject_node, relationship_type, object_node)
            tx.merge(relationship)
            
            count += 1
            
            # 打印进度提示
            if (i + 1) % 100 == 0:
                print(f"处理三元组: {i + 1}/{total}")
        
        # 提交事务
        graph.commit(tx)
    except Exception as e:
        # 回滚事务
        graph.rollback(tx)
        raise e
    
    return count


def process_mapping(graph, mapping_file):
    """
    处理映射关系并导入到 Neo4j
    :param graph: Neo4j 图实例
    :param mapping_file: 映射关系文件路径
    :return: 导入的映射关系数量
    """
    global mapping_data
    
    count = 0
    
    # 计算总映射关系数
    total_syndrome_disease = sum(len(diseases) for diseases in mapping_data.get("Syndrome_to_Disease", {}).values())
    total_disease_symptom = sum(len(symptoms) for symptoms in mapping_data.get("Disease_to_Symptom", {}).values())
    total_syndrome_symptom = sum(len(symptoms) for symptoms in mapping_data.get("Syndrome_to_Symptom", {}).values())
    total = total_syndrome_disease + total_disease_symptom + total_syndrome_symptom
    processed = 0
    
    # 开始事务
    tx = graph.begin()
    try:
        # 处理 Syndrome → Disease 映射
        syndrome_to_disease = mapping_data.get("Syndrome_to_Disease", {})
        for syndrome_name, diseases in syndrome_to_disease.items():
            if not syndrome_name or not diseases:
                continue
            
            # 获取或创建 Syndrome 节点
            syndrome_node = Node("Syndrome", name=syndrome_name)
            tx.merge(syndrome_node, "Syndrome", "name")
            
            # 处理每个对应的西医疾病
            for disease_name in diseases:
                if not disease_name:
                    continue
                    
                # 获取或创建 Disease 节点
                disease_node = Node("Disease", name=disease_name)
                tx.merge(disease_node, "Disease", "name")
                
                # 创建 CORRESPONDS_TO 关系
                relationship = Relationship(syndrome_node, "CORRESPONDS_TO", disease_node)
                tx.merge(relationship)
                
                count += 1
                processed += 1
                
                # 打印进度提示
                if processed % 100 == 0:
                    print(f"处理映射关系: {processed}/{total}")
        
        # 处理 Disease → Symptom 映射
        disease_to_symptom = mapping_data.get("Disease_to_Symptom", {})
        for disease_name, symptoms in disease_to_symptom.items():
            if not disease_name or not symptoms:
                continue
            
            # 获取或创建 Disease 节点
            disease_node = Node("Disease", name=disease_name)
            tx.merge(disease_node, "Disease", "name")
            
            # 处理每个对应的症状
            for symptom_name in symptoms:
                if not symptom_name:
                    continue
                    
                # 获取或创建 Symptom 节点
                symptom_node = Node("Symptom", name=symptom_name)
                tx.merge(symptom_node, "Symptom", "name")
                
                # 创建 HAS_SYMPTOM 关系
                relationship = Relationship(disease_node, "HAS_SYMPTOM", symptom_node)
                tx.merge(relationship)
                
                count += 1
                processed += 1
                
                # 打印进度提示
                if processed % 100 == 0:
                    print(f"处理映射关系: {processed}/{total}")
        
        # 处理 Syndrome → Symptom 映射
        syndrome_to_symptom = mapping_data.get("Syndrome_to_Symptom", {})
        for syndrome_name, symptoms in syndrome_to_symptom.items():
            if not syndrome_name or not symptoms:
                continue
            
            # 获取或创建 Syndrome 节点
            syndrome_node = Node("Syndrome", name=syndrome_name)
            tx.merge(syndrome_node, "Syndrome", "name")
            
            # 处理每个对应的症状
            for symptom_name in symptoms:
                if not symptom_name:
                    continue
                    
                # 获取或创建 Symptom 节点
                symptom_node = Node("Symptom", name=symptom_name)
                tx.merge(symptom_node, "Symptom", "name")
                
                # 创建 HAS_SYMPTOM 关系
                relationship = Relationship(syndrome_node, "HAS_SYMPTOM", symptom_node)
                tx.merge(relationship)
                
                count += 1
                processed += 1
                
                # 打印进度提示
                if processed % 100 == 0:
                    print(f"处理映射关系: {processed}/{total}")
        
        # 提交事务
        graph.commit(tx)
    except Exception as e:
        # 回滚事务
        graph.rollback(tx)
        raise e
    
    return count


def main():
    """
    主函数
    """
    global mapping_data, SYNDROME_SET, DISEASE_SET, SYMPTOM_SET
    
    # 打印脚本标题
    print("=" * 60)
    print("🧠 中西医知识图谱导入工具")
    print("📊 版本: 1.0.0 | 日期: 2025年12月7日")
    print("🔗 目标: Neo4j Aura 知识图谱构建")
    print("=" * 60)
    
    # 配置 Neo4j Aura 连接信息
    # 请根据 Neo4j-21a53539-Created-2025-12-07.txt 文件中的信息修改以下参数
    NEO4J_URI = "neo4j+s://21a53539.databases.neo4j.io"  # 从信息文件中获取
    NEO4J_USERNAME = "neo4j"  # 通常为 neo4j
    NEO4J_PASSWORD = "F8x5XocM0Otby1n5nWSkxiE_hUrejMlMf3xNP6MBM80"  # 从信息文件中获取
    
    # 文件路径配置
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    # 数据文件实际位于Neo4j目录下，使用中文括号
    JSON_DIR = os.path.join(BASE_DIR, "../Neo4j/JSON（三元组与字典）")
    
    # 数据文件路径
    CHINESE_TRIPLES_FILE = os.path.join(JSON_DIR, "chinese_triples.json")
    WESTERN_TRIPLES_FILE = os.path.join(JSON_DIR, "western_triples.json")
    MAPPING_FILE = os.path.join(JSON_DIR, "JSON_mapping_dict.json")
    
    # 加载映射数据构建全局集合，用于标签推断
    print("🔄 正在加载映射字典...")
    with open(MAPPING_FILE, "r", encoding="utf-8") as f:
        mapping_data = json.load(f)
    
    # 构建全局集合
    SYNDROME_SET = set(mapping_data.get("Syndrome_to_Disease", {}).keys())
    DISEASE_SET = set()
    for diseases in mapping_data.get("Syndrome_to_Disease", {}).values():
        DISEASE_SET.update(diseases)
    
    SYMPTOM_SET = set()
    for symptoms in mapping_data.get("Disease_to_Symptom", {}).values():
        SYMPTOM_SET.update(symptoms)
    for symptoms in mapping_data.get("Syndrome_to_Symptom", {}).values():
        SYMPTOM_SET.update(symptoms)
    
    print("✅ 映射字典加载完成")
    print(f"📊 全局集合大小: Syndrome={len(SYNDROME_SET)}, Disease={len(DISEASE_SET)}, Symptom={len(SYMPTOM_SET)}")
    
    try:
        # 连接到 Neo4j Aura
        print("\n🔌 正在连接到 Neo4j Aura...")
        print(f"📋 目标地址: {NEO4J_URI}")
        print(f"👤 用户名: {NEO4J_USERNAME}")
        
        graph = Graph(NEO4J_URI, auth=(NEO4J_USERNAME, NEO4J_PASSWORD))
        print("✅ 连接成功！")
        
        # 删除数据库原有内容
        print("\n正在清空数据库原有内容...")
        graph.run("MATCH (n) DETACH DELETE n")
        print("数据库清空完成！")
        
        # 创建索引（提升查询性能）
        print("\n🔧 正在创建索引...")
        index_queries = [
            "CREATE INDEX IF NOT EXISTS FOR (h:Herb) ON (h.name)",
            "CREATE INDEX IF NOT EXISTS FOR (f:Formula) ON (f.name)",
            "CREATE INDEX IF NOT EXISTS FOR (s:Syndrome) ON (s.name)",
            "CREATE INDEX IF NOT EXISTS FOR (d:Disease) ON (d.name)",
            "CREATE INDEX IF NOT EXISTS FOR (dr:Drug) ON (dr.name)",
            "CREATE INDEX IF NOT EXISTS FOR (sym:Symptom) ON (sym.name)",
            "CREATE INDEX IF NOT EXISTS FOR (e:Entity) ON (e.name)"
        ]
        for q in index_queries:
            graph.run(q)
        print("✅ 索引创建完成")
        
        # 处理中医三元组
        print("\n开始处理中医三元组...")
        chinese_count = process_triples(graph, CHINESE_TRIPLES_FILE)
        print(f"中医三元组处理完成，导入 {chinese_count} 条有效数据")
        
        # 处理西医三元组
        print("\n开始处理西医三元组...")
        western_count = process_triples(graph, WESTERN_TRIPLES_FILE)
        print(f"西医三元组处理完成，导入 {western_count} 条有效数据")
        
        # 处理映射关系
        print("\n开始处理中西医映射关系...")
        mapping_count = process_mapping(graph, MAPPING_FILE)
        print(f"映射关系处理完成，导入 {mapping_count} 条有效数据")
        
        # 输出总统计
        total = chinese_count + western_count + mapping_count
        print("\n" + "=" * 60)
        print("🎉 所有数据导入完成！")
        print("📊 导入统计:")
        print(f"   中医三元组: {chinese_count} 条")
        print(f"   西医三元组: {western_count} 条")
        print(f"   映射关系: {mapping_count} 条")
        print(f"   总计: {total} 条有效数据")
        print("" + "=" * 60)
        print("💡 使用提示:")
        print("   - 在 Neo4j Browser 中运行: MATCH (n) RETURN count(n)")
        print("   - 查询实体示例: MATCH (n:Herb) RETURN n LIMIT 10")
        print("   - 查询关系示例: MATCH ()-[r:TREATS]->() RETURN r LIMIT 10")
        print("   - 查询映射关系: MATCH (s:Syndrome)-[:CORRESPONDS_TO]->(d:Disease) RETURN s, d LIMIT 10")
        print("=" * 60)
        
    except Exception as e:
        print("\n" + "=" * 60)
        print("❌ 导入过程中发生错误！")
        print(f"   错误信息: {str(e)}")
        print("💡 解决建议:")
        print("   1. 检查 Neo4j Aura 连接信息是否正确")
        print("   2. 确保 Neo4j Aura 实例正在运行")
        print("   3. 检查数据文件格式是否符合要求")
        print("   4. 查看控制台输出的详细错误信息")
        print("=" * 60)


if __name__ == "__main__":
    main()