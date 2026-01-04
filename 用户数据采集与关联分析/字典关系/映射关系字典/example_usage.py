#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
中西医映射字典使用示例
演示如何使用映射字典进行查询和分析
"""

import json


def load_mapping_dict(file_path='中西医映射关系字典.json'):
    """加载映射字典"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def query_syndrome_to_disease(mapping_dict, syndrome):
    """查询证候对应的疾病"""
    diseases = mapping_dict['Syndrome_to_Disease'].get(syndrome, [])
    if diseases:
        print(f"\n📋 证候: {syndrome}")
        print(f"   可能对应的西医疾病: {', '.join(diseases)}")
        return diseases
    else:
        print(f"\n❌ 未找到证候 '{syndrome}' 的映射关系")
        return []


def query_disease_to_symptom(mapping_dict, disease):
    """查询疾病的症状"""
    symptoms = mapping_dict['Disease_to_Symptom'].get(disease, [])
    if symptoms:
        print(f"\n🏥 疾病: {disease}")
        print(f"   主要症状: {', '.join(symptoms)}")
        return symptoms
    else:
        print(f"\n❌ 未找到疾病 '{disease}' 的症状信息")
        return []


def query_syndrome_to_symptom(mapping_dict, syndrome):
    """查询证候的症状表现"""
    symptoms = mapping_dict['Syndrome_to_Symptom'].get(syndrome, [])
    if symptoms:
        print(f"\n🌿 证候: {syndrome}")
        print(f"   症状表现: {', '.join(symptoms)}")
        return symptoms
    else:
        print(f"\n❌ 未找到证候 '{syndrome}' 的症状信息")
        return []


def find_common_diseases(mapping_dict, syndrome1, syndrome2):
    """查找两个证候共同对应的疾病"""
    diseases1 = set(mapping_dict['Syndrome_to_Disease'].get(syndrome1, []))
    diseases2 = set(mapping_dict['Syndrome_to_Disease'].get(syndrome2, []))
    common = diseases1 & diseases2
    
    print(f"\n🔍 分析证候交集:")
    print(f"   {syndrome1} 对应疾病: {', '.join(diseases1) if diseases1 else '无'}")
    print(f"   {syndrome2} 对应疾病: {', '.join(diseases2) if diseases2 else '无'}")
    print(f"   共同对应的疾病: {', '.join(common) if common else '无'}")
    
    return list(common)


def reverse_query_disease_by_symptom(mapping_dict, symptom):
    """根据症状反查可能的疾病"""
    diseases = []
    for disease, symptoms in mapping_dict['Disease_to_Symptom'].items():
        if symptom in symptoms:
            diseases.append(disease)
    
    if diseases:
        print(f"\n🔎 症状: {symptom}")
        print(f"   可能的疾病: {', '.join(diseases)}")
        return diseases
    else:
        print(f"\n❌ 未找到包含症状 '{symptom}' 的疾病")
        return []


def reverse_query_syndrome_by_symptom(mapping_dict, symptom):
    """根据症状反查可能的证候"""
    syndromes = []
    for syndrome, symptoms in mapping_dict['Syndrome_to_Symptom'].items():
        if symptom in symptoms:
            syndromes.append(syndrome)
    
    if syndromes:
        print(f"\n🔎 症状: {symptom}")
        print(f"   可能的证候: {', '.join(syndromes)}")
        return syndromes
    else:
        print(f"\n❌ 未找到包含症状 '{symptom}' 的证候")
        return []


def comprehensive_query(mapping_dict, syndrome):
    """综合查询：证候 -> 疾病 -> 症状"""
    print(f"\n{'='*60}")
    print(f"综合查询: {syndrome}")
    print(f"{'='*60}")
    
    # 1. 查询证候对应的疾病
    diseases = mapping_dict['Syndrome_to_Disease'].get(syndrome, [])
    print(f"\n1️⃣ 对应的西医疾病 ({len(diseases)}个):")
    for disease in diseases:
        print(f"   - {disease}")
    
    # 2. 查询证候的症状表现
    syndrome_symptoms = mapping_dict['Syndrome_to_Symptom'].get(syndrome, [])
    print(f"\n2️⃣ 证候的症状表现 ({len(syndrome_symptoms)}个):")
    print(f"   {', '.join(syndrome_symptoms)}")
    
    # 3. 查询对应疾病的症状
    all_disease_symptoms = set()
    for disease in diseases:
        symptoms = mapping_dict['Disease_to_Symptom'].get(disease, [])
        all_disease_symptoms.update(symptoms)
    
    print(f"\n3️⃣ 对应疾病的所有症状 ({len(all_disease_symptoms)}个):")
    print(f"   {', '.join(sorted(all_disease_symptoms))}")
    
    # 4. 分析症状重合度
    syndrome_symptoms_set = set(syndrome_symptoms)
    common_symptoms = syndrome_symptoms_set & all_disease_symptoms
    
    print(f"\n4️⃣ 证候与疾病症状的重合:")
    print(f"   重合症状 ({len(common_symptoms)}个): {', '.join(sorted(common_symptoms))}")
    if syndrome_symptoms_set:
        overlap_rate = len(common_symptoms) / len(syndrome_symptoms_set) * 100
        print(f"   重合率: {overlap_rate:.1f}%")


def display_statistics(mapping_dict):
    """显示统计信息"""
    print("\n" + "="*60)
    print("中西医映射字典统计信息")
    print("="*60)
    
    # 统计证候到疾病
    syndrome_to_disease = mapping_dict['Syndrome_to_Disease']
    print(f"\n📊 证候到疾病映射:")
    print(f"   证候数量: {len(syndrome_to_disease)}")
    total_mappings = sum(len(v) for v in syndrome_to_disease.values())
    print(f"   映射关系: {total_mappings} 条")
    avg_diseases = total_mappings / len(syndrome_to_disease) if syndrome_to_disease else 0
    print(f"   平均每个证候对应疾病数: {avg_diseases:.1f}")
    
    # 统计疾病到症状
    disease_to_symptom = mapping_dict['Disease_to_Symptom']
    print(f"\n📊 疾病到症状映射:")
    print(f"   疾病数量: {len(disease_to_symptom)}")
    total_mappings = sum(len(v) for v in disease_to_symptom.values())
    print(f"   映射关系: {total_mappings} 条")
    avg_symptoms = total_mappings / len(disease_to_symptom) if disease_to_symptom else 0
    print(f"   平均每个疾病的症状数: {avg_symptoms:.1f}")
    
    # 统计证候到症状
    syndrome_to_symptom = mapping_dict['Syndrome_to_Symptom']
    print(f"\n📊 证候到症状映射:")
    print(f"   证候数量: {len(syndrome_to_symptom)}")
    total_mappings = sum(len(v) for v in syndrome_to_symptom.values())
    print(f"   映射关系: {total_mappings} 条")
    avg_symptoms = total_mappings / len(syndrome_to_symptom) if syndrome_to_symptom else 0
    print(f"   平均每个证候的症状数: {avg_symptoms:.1f}")
    
    # 统计所有涉及的实体
    all_syndromes = set(syndrome_to_disease.keys()) | set(syndrome_to_symptom.keys())
    all_diseases = set(disease_to_symptom.keys())
    all_symptoms_from_disease = set()
    for symptoms in disease_to_symptom.values():
        all_symptoms_from_disease.update(symptoms)
    all_symptoms_from_syndrome = set()
    for symptoms in syndrome_to_symptom.values():
        all_symptoms_from_syndrome.update(symptoms)
    all_symptoms = all_symptoms_from_disease | all_symptoms_from_syndrome
    
    print(f"\n📊 实体统计:")
    print(f"   中医证候: {len(all_syndromes)} 个")
    print(f"   西医疾病: {len(all_diseases)} 个")
    print(f"   症状: {len(all_symptoms)} 个")


def main():
    """主函数 - 演示各种查询功能"""
    print("="*60)
    print("中西医映射字典使用示例")
    print("="*60)
    
    # 加载映射字典
    mapping_dict = load_mapping_dict()
    
    # 显示统计信息
    display_statistics(mapping_dict)
    
    print("\n" + "="*60)
    print("查询示例")
    print("="*60)
    
    # 示例1: 查询证候对应的疾病
    query_syndrome_to_disease(mapping_dict, "气血不足")
    query_syndrome_to_disease(mapping_dict, "肾阳虚")
    
    # 示例2: 查询疾病的症状
    query_disease_to_symptom(mapping_dict, "糖尿病")
    query_disease_to_symptom(mapping_dict, "肝炎")
    
    # 示例3: 查询证候的症状
    query_syndrome_to_symptom(mapping_dict, "痰湿")
    
    # 示例4: 查找共同疾病
    find_common_diseases(mapping_dict, "气血不足", "肾阳虚")
    
    # 示例5: 根据症状反查疾病
    reverse_query_disease_by_symptom(mapping_dict, "乏力")
    
    # 示例6: 根据症状反查证候
    reverse_query_syndrome_by_symptom(mapping_dict, "头晕")
    
    # 示例7: 综合查询
    comprehensive_query(mapping_dict, "肾阳虚")
    
    print("\n" + "="*60)
    print("✅ 示例演示完成!")
    print("="*60)


if __name__ == "__main__":
    main()
