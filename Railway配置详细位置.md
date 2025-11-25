# 📍 Railway配置详细位置指南

您现在在正确的页面！这是 `tcm-knowledge-graph` 服务的设置页面。

---

## 🎯 第一步：设置Root Directory

### 位置：Source部分

1. **找到"Source"部分**
   - 在页面右侧的快速导航中，点击 **"Source"**
   - 或向下滚动到 "Source" 部分

2. **添加Root Directory**
   - 在 "Source" 部分，您会看到：
     - "Source Repo: shaonayan/tcm-knowledge-graph"
     - **"Add Root Directory"** 链接 ← 点击这个
   
3. **输入目录**
   - 点击 "Add Root Directory" 后，会出现输入框
   - 输入：`backend`
   - 点击保存或确认

**为什么？** 因为您的后端代码在 `backend` 文件夹中。

---

## 🎯 第二步：添加环境变量

### 位置：Variables标签

1. **点击"Variables"标签**
   - 在页面顶部，有四个标签：
     - Deployments
     - **Variables** ← 点击这个
     - Metrics
     - Settings（当前）

2. **添加环境变量**
   - 在Variables页面，点击 **"New Variable"** 或 **"+"** 按钮
   - 逐个添加以下变量：

#### 需要添加的环境变量：

```
变量1:
Name: NODE_ENV
Value: production

变量2:
Name: PORT
Value: 3001

变量3:
Name: NEO4J_URI
Value: neo4j+s://您的Neo4j地址.databases.neo4j.io

变量4:
Name: NEO4J_USER
Value: neo4j

变量5:
Name: NEO4J_PASSWORD
Value: 您的Neo4j密码

变量6:
Name: FRONTEND_URL
Value: https://您的前端地址.vercel.app
```

3. **保存每个变量**
   - 每添加一个变量，点击 "Add" 或 "Save"
   - Railway会自动触发部署

---

## 🎯 第三步：设置启动命令（可选）

### 位置：Deploy部分

1. **找到"Deploy"部分**
   - 在右侧快速导航中，点击 **"Deploy"**
   - 或向下滚动到 "Deploy" 部分

2. **添加Start Command**
   - 找到 "Custom Start Command"
   - 点击 **"+ Start Command"** 按钮
   - 输入：`node server-simple.js`
   - 或：`npm start`
   - 保存

**注意：** 如果 `package.json` 中有 `start` 脚本，可能不需要手动设置。

---

## 🎯 第四步：生成公共域名

### 位置：Networking部分

1. **找到"Networking"部分**
   - 在右侧快速导航中，点击 **"Networking"**
   - 或向下滚动到 "Networking" 部分

2. **生成域名**
   - 在 "Public Networking" 部分
   - 点击 **"Generate Domain"** 按钮
   - Railway会生成一个公共URL
   - **复制这个URL**，稍后需要在Vercel配置

---

## 📋 完整操作流程

### 现在立即操作：

1. ✅ **设置Root Directory**
   - 在 "Source" 部分
   - 点击 "Add Root Directory"
   - 输入：`backend`
   - 保存

2. ✅ **添加环境变量**
   - 点击顶部的 "Variables" 标签
   - 点击 "New Variable"
   - 逐个添加6个环境变量
   - 保存每个变量

3. ✅ **等待部署**
   - Railway会自动开始部署
   - 查看 "Deployments" 标签查看进度

4. ✅ **获取后端URL**
   - 在 "Networking" 部分
   - 点击 "Generate Domain"
   - 复制URL

---

## 🎯 页面布局说明

您的页面应该有以下部分：

**顶部标签：**
- Deployments（部署历史）
- **Variables**（环境变量）← 点击这里添加变量
- Metrics（指标）
- Settings（设置）← 您当前在这里

**右侧快速导航：**
- Source（源代码配置）← Root Directory在这里
- Networking（网络配置）← 生成域名在这里
- Build（构建配置）
- Deploy（部署配置）← Start Command在这里
- Config-as-code
- Danger（危险操作）

---

## ✅ 确认配置完成

配置完成后，您应该：
- ✅ Root Directory 设置为 `backend`
- ✅ 6个环境变量都已添加
- ✅ 部署状态显示 "Building" 或 "Running"
- ✅ 有公共域名URL

---

## 🚀 下一步

配置完成后：
1. 等待部署完成（约3-5分钟）
2. 获取后端URL
3. 在Vercel添加 `VITE_API_URL` 环境变量
4. 测试网站功能

现在开始配置吧！按照上面的步骤操作即可。💪

