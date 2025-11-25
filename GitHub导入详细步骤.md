# 📦 将中医知识图谱项目导入GitHub

## 🚀 快速方式（推荐）

### 方式一：使用一键脚本

1. **运行脚本**
   ```bash
   双击运行：导入GitHub仓库.bat
   ```

2. **在GitHub创建仓库**
   - 访问：https://github.com/new
   - 仓库名称：`tcm-knowledge-graph`
   - 选择 Public 或 Private
   - **不要**勾选任何初始化选项（README、.gitignore等）
   - 点击 "Create repository"

3. **连接并推送**
   ```bash
   git remote add origin https://github.com/您的用户名/tcm-knowledge-graph.git
   git branch -M main
   git push -u origin main
   ```

---

## 📝 详细步骤（手动操作）

### 步骤 1：检查Git安装

```bash
git --version
```

如果未安装，下载：https://git-scm.com/download/win

### 步骤 2：初始化Git仓库

```bash
cd tcm-knowledge-graph
git init
```

### 步骤 3：配置Git用户信息（首次使用）

```bash
git config --global user.name "您的名字"
git config --global user.email "您的邮箱"
```

### 步骤 4：添加文件

```bash
git add .
```

### 步骤 5：创建初始提交

```bash
git commit -m "初始提交：中医知识图谱项目"
```

### 步骤 6：在GitHub创建仓库

1. 访问：https://github.com/new
2. 填写信息：
   - **Repository name**: `tcm-knowledge-graph`
   - **Description**: `中医知识图谱Web应用 - 基于Neo4j的知识图谱可视化系统`
   - **Visibility**: 选择 Public（公开）或 Private（私有）
   - **不要勾选**：
     - ❌ Add a README file
     - ❌ Add .gitignore
     - ❌ Choose a license
3. 点击 "Create repository"

### 步骤 7：连接本地仓库到GitHub

GitHub会显示命令，复制并执行：

```bash
# 添加远程仓库
git remote add origin https://github.com/您的用户名/tcm-knowledge-graph.git

# 重命名分支为main（如果当前是master）
git branch -M main

# 推送到GitHub
git push -u origin main
```

---

## 🖥️ 方式二：使用GitHub Desktop（最简单）

### 步骤：

1. **下载GitHub Desktop**
   - 访问：https://desktop.github.com/
   - 下载并安装

2. **登录GitHub账号**
   - 打开GitHub Desktop
   - 使用GitHub账号登录

3. **添加本地仓库**
   - 点击 File → Add Local Repository
   - 选择 `tcm-knowledge-graph` 文件夹
   - 点击 "Add repository"

4. **发布到GitHub**
   - 点击 "Publish repository" 按钮
   - 填写仓库名称：`tcm-knowledge-graph`
   - 选择 Public 或 Private
   - 点击 "Publish repository"

完成！您的代码已上传到GitHub。

---

## 🔐 重要提示

### 1. 敏感信息保护

确保以下文件**不会被提交**（已在.gitignore中）：
- ✅ `.env` - 包含数据库密码等敏感信息
- ✅ `node_modules/` - 依赖包（太大）
- ✅ `dist/` - 构建文件（可以重新构建）

### 2. 检查敏感文件

推送前检查是否有敏感信息：

```bash
# 查看将要提交的文件
git status

# 查看具体更改
git diff
```

### 3. 如果误提交了敏感信息

```bash
# 从Git历史中删除文件
git rm --cached backend/.env
git commit -m "移除敏感文件"
git push
```

---

## 📋 推送后的操作

### 1. 验证上传

访问您的GitHub仓库：
```
https://github.com/您的用户名/tcm-knowledge-graph
```

应该能看到所有文件。

### 2. 在Vercel中导入

1. 访问：https://vercel.com/new
2. 在"导入 Git 仓库"中搜索 `tcm-knowledge-graph`
3. 点击"进口"（Import）
4. 配置项目（见部署指南）

### 3. 后续更新

每次修改代码后：

```bash
git add .
git commit -m "描述您的更改"
git push
```

Vercel会自动检测并重新部署。

---

## ❓ 常见问题

### Q1: 推送时要求输入用户名密码？

**解决：** 使用Personal Access Token
1. GitHub → Settings → Developer settings → Personal access tokens
2. 生成新token（勾选repo权限）
3. 使用token作为密码

### Q2: 文件太大无法推送？

**解决：** 检查.gitignore，确保忽略：
- `node_modules/`
- `dist/`
- 大文件

### Q3: 想删除GitHub上的某个文件？

```bash
git rm 文件名
git commit -m "删除文件"
git push
```

### Q4: 想更新GitHub上的README？

```bash
# 编辑README.md
git add README.md
git commit -m "更新README"
git push
```

---

## 🎯 下一步

上传到GitHub后，您可以：

1. ✅ 在Vercel导入并部署前端
2. ✅ 在Railway部署后端
3. ✅ 分享代码给他人
4. ✅ 使用Git进行版本控制

祝您上传顺利！🚀

