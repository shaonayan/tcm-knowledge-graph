# 🚀 Render连接GitHub并部署后端

您现在在Render的配置页面，需要先连接GitHub仓库。

---

## 🎯 步骤1：连接GitHub

### 操作：

1. **在"Source Code"部分**
   - 您会看到 "No repositories found"
   - 找到 **"GitHub"** 按钮（黑色图标）
   - **点击 "GitHub" 按钮**

2. **授权Render访问GitHub**
   - 会跳转到GitHub授权页面
   - 点击 "Authorize Render" 或 "授权"
   - 允许Render访问您的仓库

3. **返回Render**
   - 授权完成后，会自动返回Render
   - 现在应该能看到您的仓库列表

---

## 🎯 步骤2：选择仓库

### 操作：

1. **在仓库列表中**
   - 找到 `tcm-knowledge-graph` 仓库
   - **点击选择这个仓库**

2. **确认选择**
   - 仓库会被选中
   - 可以继续下一步配置

---

## 🎯 步骤3：配置服务

### 3.1 选择服务类型

1. **在"Select a service type"部分**
   - 确认选择的是 **"Web Service"**
   - 如果不是，从下拉菜单选择

### 3.2 设置名称

1. **在"Name"部分**
   - 输入服务名称：`tcm-knowledge-graph-backend`
   - 或使用默认名称

### 3.3 配置部署设置

配置以下信息（通常在下一步或滚动页面下方）：

- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install`（或留空）
- **Start Command**: `node server-simple.js`

---

## 🎯 步骤4：添加环境变量

### 操作：

1. **找到"Environment Variables"部分**
   - 通常在配置页面的下方
   - 或点击 "Advanced" 展开

2. **添加环境变量**
   点击 "Add Environment Variable"，逐个添加：

   ```
   NODE_ENV = production
   PORT = 3001
   NEO4J_URI = neo4j+s://f36358f7.databases.neo4j.io
   NEO4J_USER = neo4j
   NEO4J_PASSWORD = RWXciE-YrfUELz2i36U_0L80MFD0gpYtEHroztDJb_U
   FRONTEND_URL = https://tcm-knowledge-graph-jr76.vercel.app
   ```

---

## 🎯 步骤5：选择计划并部署

### 操作：

1. **选择计划**
   - 在页面底部，选择 **"Free"** 免费计划
   - 或 "Starter"（如果免费计划不可用）

2. **点击部署按钮**
   - 找到 "Deploy Web Service" 或 "Create Web Service" 按钮
   - 点击开始部署

3. **等待部署**
   - Render会自动开始部署
   - 等待约5-10分钟
   - 可以在部署日志中查看进度

---

## 📋 完整操作流程

### 现在立即操作：

1. ✅ **点击 "GitHub" 按钮**
   - 在 "Source Code" 部分
   - 授权Render访问GitHub

2. ✅ **选择仓库**
   - 选择 `tcm-knowledge-graph` 仓库

3. ✅ **配置服务**
   - Root Directory: `backend`
   - Start Command: `node server-simple.js`
   - 添加环境变量

4. ✅ **部署**
   - 选择免费计划
   - 点击部署按钮

---

## ⚠️ 如果看不到GitHub按钮

### 可能的情况：

1. **已经连接过GitHub**
   - 刷新页面
   - 或直接选择仓库

2. **需要先注册**
   - 确保已登录Render账号
   - 如果没有，先注册

3. **权限问题**
   - 检查GitHub授权
   - 重新授权

---

## 🎯 现在操作

1. **点击 "GitHub" 按钮**（黑色图标）
2. **授权Render访问GitHub**
3. **返回后选择 `tcm-knowledge-graph` 仓库**
4. **继续配置**

完成后告诉我，我会继续帮您完成后续步骤！

