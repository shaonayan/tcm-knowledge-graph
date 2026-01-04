import pdfplumber

try:
    with pdfplumber.open('常用临床医学名词（1-108页）.pdf') as pdf:
        print(f"PDF文件共{len(pdf.pages)}页")
        if len(pdf.pages) > 0:
            page = pdf.pages[0]
            text = page.extract_text()
            print("第一页内容预览:")
            print(text[:1000])  # 只显示前1000个字符
            
            # 保存第一页内容到文件，方便查看
            with open('pdf_test_output.txt', 'w', encoding='utf-8') as f:
                f.write(text)
            print("\n第一页完整内容已保存到pdf_test_output.txt")
except Exception as e:
    print(f"处理PDF时出错: {e}")
