import requests
from bs4 import BeautifulSoup
import time
import re
import json
from opencc import OpenCC

# 设置目标URL
url = "https://cloudtcm.com/dic"

# 添加更完整的请求头模拟浏览器访问
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1"
}

def extract_all_terms(html_content):
    """从HTML内容中提取所有专有名词"""
    # 查找所有包含术语的JSON结构
    term_pattern = r'{"title":"([^"]+)","target":"[^"]+","route":"[^"]+"}'
    matches = re.findall(term_pattern, html_content)
    
    if matches:
        # 去重并排序
        unique_terms = sorted(list(set(matches)))
        print(f"共提取到 {len(unique_terms)} 个专有名词")
        return unique_terms
    else:
        print("未提取到任何专有名词")
        return []

def traditional_to_simplified(terms):
    """将繁体术语转换为简体"""
    cc = OpenCC('t2s')  # t2s表示繁体转简体
    simplified_terms = []
    for term in terms:
        simplified_terms.append(cc.convert(term))
    return simplified_terms

def main():
    try:
        # 发送请求获取网页内容，增加超时和重定向处理
        session = requests.Session()
        response = session.get(url, headers=headers, timeout=10, allow_redirects=True)
        response.encoding = response.apparent_encoding  # 自动检测编码
        
        print(f"最终URL: {response.url}")
        print(f"状态码: {response.status_code}")
        
        if response.status_code == 200:
            # 保存原始HTML内容用于分析
            with open("original_html.txt", "w", encoding="utf-8") as f:
                f.write(response.text)
            
            # 提取所有专有名词
            print("\n开始提取所有专有名词...")
            terms = extract_all_terms(response.text)
            
            if terms:
                print(f"\n成功提取到 {len(terms)} 个专有名词:")
                for i, term in enumerate(terms[:20], 1):  # 只显示前20个
                    print(f"{i}. {term}")
                if len(terms) > 20:
                    print(f"... 还有 {len(terms) - 20} 个术语未显示")
                
                # 转换为简体字
                print("\n开始将繁体转换为简体...")
                simplified_terms = traditional_to_simplified(terms)
                
                print(f"\n繁体转换为简体完成:")
                for i, (traditional, simplified) in enumerate(zip(terms[:20], simplified_terms[:20]), 1):
                    print(f"{i}. {traditional} -> {simplified}")
                if len(terms) > 20:
                    print(f"... 还有 {len(terms) - 20} 个术语未显示")
                
                # 保存繁体术语到txt文件
                with open("繁体专有名词.txt", "w", encoding="utf-8") as f:
                    for term in terms:
                        f.write(f"{term}\n")
                print(f"\n繁体术语已保存到 '繁体专有名词.txt' 文件")
                
                # 保存简体术语到txt文件
                with open("简体专有名词.txt", "w", encoding="utf-8") as f:
                    for term in simplified_terms:
                        f.write(f"{term}\n")
                print(f"简体术语已保存到 '简体专有名词.txt' 文件")
            else:
                print("未提取到任何专有名词")
        else:
            print(f"请求失败，状态码: {response.status_code}")
            print(f"响应头: {response.headers}")
    except Exception as e:
        print(f"发生错误: {e}")
        # 尝试使用代理或其他方式
        print("\n尝试使用另一种方式获取...")
        try:
            # 增加延迟
            time.sleep(2)
            # 使用不同的请求方式
            response = requests.get(url, headers=headers, timeout=15)
            response.encoding = response.apparent_encoding
            
            if response.status_code == 200:
                with open("original_html.txt", "w", encoding="utf-8") as f:
                    f.write(response.text)
                
                # 提取所有专有名词
                print("开始提取所有专有名词...")
                terms = extract_all_terms(response.text)
                
                if terms:
                    print(f"成功提取到 {len(terms)} 个专有名词")
                    
                    # 转换为简体字
                    print("开始将繁体转换为简体...")
                    simplified_terms = traditional_to_simplified(terms)
                    
                    # 保存繁体术语到txt文件
                    with open("繁体专有名词.txt", "w", encoding="utf-8") as f:
                        for term in terms:
                            f.write(f"{term}\n")
                    print(f"繁体术语已保存到 '繁体专有名词.txt' 文件")
                    
                    # 保存简体术语到txt文件
                    with open("简体专有名词.txt", "w", encoding="utf-8") as f:
                        for term in simplified_terms:
                            f.write(f"{term}\n")
                    print(f"简体术语已保存到 '简体专有名词.txt' 文件")
            else:
                print(f"第二次尝试失败，状态码: {response.status_code}")
        except Exception as e2:
            print(f"第二次尝试也失败了: {e2}")

if __name__ == "__main__":
    main()

