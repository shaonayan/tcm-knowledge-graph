import os
import shutil
from pathlib import Path
import pdfplumber
from tqdm import tqdm

def convert_md_to_txt(src_path, dst_path):
    """Convert markdown file to txt"""
    try:
        with open(src_path, 'r', encoding='utf-8') as f:
            content = f.read()
        # Simply copy the content as is
        with open(dst_path, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    except Exception as e:
        print(f"Error converting {src_path}: {e}")
        return False

def convert_pdf_to_txt(src_path, dst_path):
    """Convert PDF file to txt"""
    try:
        text = ""
        with pdfplumber.open(src_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        with open(dst_path, 'w', encoding='utf-8') as f:
            f.write(text)
        return True
    except Exception as e:
        print(f"Error converting {src_path}: {e}")
        return False

def convert_txt_to_txt(src_path, dst_path):
    """Copy txt file"""
    try:
        shutil.copy2(src_path, dst_path)
        return True
    except Exception as e:
        print(f"Error copying {src_path}: {e}")
        return False

def process_directory(src_dir, dst_dir):
    """Process all files in a directory"""
    # Create destination directory if it doesn't exist
    os.makedirs(dst_dir, exist_ok=True)
    
    # Get list of files to process
    files_to_process = []
    for filename in os.listdir(src_dir):
        src_path = os.path.join(src_dir, filename)
        
        # Skip directories
        if os.path.isdir(src_path):
            continue
            
        # Get file extension
        name, ext = os.path.splitext(filename)
        
        # Add to processing list if it's a supported file type
        if ext.lower() in ['.md', '.pdf', '.txt']:
            files_to_process.append((src_path, filename, ext.lower()))
    
    # Process files with progress bar
    success_count = 0
    error_count = 0
    
    for src_path, filename, ext in tqdm(files_to_process, desc=f"Processing {os.path.basename(src_dir)}"):
        # Get file name without extension
        name, _ = os.path.splitext(filename)
        
        # Define destination path with .txt extension
        dst_filename = name + '.txt'
        dst_path = os.path.join(dst_dir, dst_filename)
        
        # Convert based on file extension
        if ext == '.md':
            if convert_md_to_txt(src_path, dst_path):
                success_count += 1
            else:
                error_count += 1
        elif ext == '.pdf':
            if convert_pdf_to_txt(src_path, dst_path):
                success_count += 1
            else:
                error_count += 1
        elif ext == '.txt':
            if convert_txt_to_txt(src_path, dst_path):
                success_count += 1
            else:
                error_count += 1
    
    print(f"Completed {os.path.basename(src_dir)}: {success_count} successful, {error_count} errors")
    return success_count, error_count

def main():
    # Define source and destination base directories
    base_src_dir = "../数据爬取"
    base_dst_dir = "."
    
    total_success = 0
    total_errors = 0
    
    # Process Chinese Medicine Science data
    src_chinese_dir = os.path.join(base_src_dir, "Data_ChineseMedicineScience")
    dst_chinese_dir = os.path.join(base_dst_dir, "Data_ChineseMedicineScience")
    print(f"Processing Chinese Medicine Science data...")
    if os.path.exists(src_chinese_dir):
        success, errors = process_directory(src_chinese_dir, dst_chinese_dir)
        total_success += success
        total_errors += errors
    else:
        print(f"Source directory {src_chinese_dir} does not exist")
    
    # Process Western Medicine data
    src_western_dir = os.path.join(base_src_dir, "Data_WesternMedicine")
    dst_western_dir = os.path.join(base_dst_dir, "Data_WesternMedicine")
    print(f"Processing Western Medicine data...")
    if os.path.exists(src_western_dir):
        success, errors = process_directory(src_western_dir, dst_western_dir)
        total_success += success
        total_errors += errors
    else:
        print(f"Source directory {src_western_dir} does not exist")
    
    print(f"\nData cleaning completed! Total: {total_success} successful, {total_errors} errors")

if __name__ == "__main__":
    main()