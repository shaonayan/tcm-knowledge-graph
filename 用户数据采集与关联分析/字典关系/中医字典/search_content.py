# 搜索HTML文件中的针灸相关内容

with open("original_html.txt", "r", encoding="utf-8") as f:
    content = f.read()

# 搜索针灸相关的关键词
keywords = ["針灸", "石針", "角針", "喉針", "鍼", "針"]

for keyword in keywords:
    count = content.count(keyword)
    print(f"'{keyword}' 出现次数: {count}")
    if count > 0:
        # 查找并显示包含关键词的上下文
        print(f"\n包含'{keyword}'的上下文：")
        index = content.find(keyword)
        while index != -1:
            # 显示关键词前后50个字符的上下文
            start = max(0, index - 50)
            end = min(len(content), index + len(keyword) + 50)
            print(f"...{content[start:end]}...")
            # 查找下一个出现的位置
            index = content.find(keyword, index + 1)
            if index == -1 or end >= len(content):
                break
        print("\n---")
