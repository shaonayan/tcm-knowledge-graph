import json

# 检查三元组数量
with open('chinese_triples.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
    print(f'中医三元组: {len(data.get("triples",[]))} 条')

with open('western_triples.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
    print(f'西医三元组: {len(data.get("triples",[]))} 条')
