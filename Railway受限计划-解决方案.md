# ⚠️ Railway受限计划问题 - 解决方案

Railway显示"Limited Access"，说明您的账户在受限计划上，只能部署数据库，无法部署Node.js应用。

---

## 🔍 问题分析

### 从界面可以看到：

1. **"Limited Access"警告**
   - 显示："Your account is on a limited plan and can only deploy databases"
   - 说明：只能部署数据库，不能部署应用

2. **"No deploys for this service"**
   - 没有活跃的部署
   - 服务无法运行

3. **"Unexposed service"**
   - 服务未暴露
   - 无法生成公共域名

---

## ✅ 解决方案

### 方案一：使用Render部署后端（推荐，免费）

Render是类似Railway的平台，免费层支持Node.js应用。

#### 步骤：

1. **访问Render**
   - 打开：https://render.com
   - 使用GitHub账号登录

2. **创建新服务**
   - 点击 "New +" → "Web Service"
   - 选择 "Connect GitHub"
   - 选择 `tcm-knowledge-graph` 仓库

3. **配置服务**
   - **Name**: `tcm-knowledge-graph-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server-simple.js`

4. **添加环境变量**
   - 在 "Environment Variables" 部分，添加：
     ```
     NODE_ENV=production
     PORT=3001
     NEO4J_URI=neo4j+s://f36358f7.databases.neo4j.io
     NEO4J_USER=neo4j
     NEO4J_PASSWORD=RWXciE-YrfUELz2i36U_0L80MFD0gpYtEHroztDJb_U
     FRONTEND_URL=https://tcm-knowledge-graph-jr76.vercel.app
     ```

5. **部署**
   - 点击 "Create Web Service"
   - 等待部署完成（约5-10分钟）
   - 获得后端URL：`https://tcm-knowledge-graph-backend.onrender.com`

6. **更新Vercel环境变量**
   - 在Vercel添加：
     ```
     VITE_API_URL=https://tcm-knowledge-graph-backend.onrender.com/api
     ```
   - 重新部署前端

---

### 方案二：使用Fly.io部署后端（免费）

Fly.io也支持免费部署Node.js应用。

#### 步骤：

1. **访问Fly.io**
   - 打开：https://fly.io
   - 注册账号

2. **安装Fly CLI**
   - 按照官网说明安装

3. **部署应用**
   - 在项目目录运行部署命令

---

### 方案三：使用云服务器（需要付费）

如果预算允许，可以使用：
- 阿里云
- 腾讯云
- AWS
- Google Cloud

---

## 🎯 推荐方案：使用Render（最简单）

### 为什么选择Render：

- ✅ 免费层支持Node.js应用
- ✅ 类似Railway的界面
- ✅ 支持GitHub自动部署
- ✅ 有免费额度

### 快速部署步骤：

1. **访问Render**
   - https://render.com
   - 用GitHub登录

2. **创建Web Service**
   - New + → Web Service
   - 连接GitHub仓库

3. **配置**
   - Root Directory: `backend`
   - Start Command: `node server-simple.js`
   - 添加环境变量

4. **部署**
   - 等待完成
   - 获取URL

5. **更新Vercel**
   - 更新 `VITE_API_URL`
   - 重新部署

---

## 📋 Render部署详细步骤

### 步骤1：创建账户

1. 访问：https://render.com
2. 点击 "Get Started for Free"
3. 使用GitHub账号登录

### 步骤2：创建Web Service

1. 点击 "New +" 按钮
2. 选择 "Web Service"
3. 选择 "Connect GitHub"
4. 授权Render访问您的仓库
5. 选择 `tcm-knowledge-graph` 仓库

### 步骤3：配置服务

填写以下信息：

- **Name**: `tcm-knowledge-graph-backend`
- **Region**: 选择离您最近的区域（如Singapore）
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install`（或留空，Render会自动检测）
- **Start Command**: `node server-simple.js`

### 步骤4：添加环境变量

在 "Environment Variables" 部分，点击 "Add Environment Variable"，逐个添加：

```
NODE_ENV = production
PORT = 3001
NEO4J_URI = neo4j+s://f36358f7.databases.neo4j.io
NEO4J_USER = neo4j
NEO4J_PASSWORD = RWXciE-YrfUELz2i36U_0L80MFD0gpYtEHroztDJb_U
FRONTEND_URL = https://tcm-knowledge-graph-jr76.vercel.app
```

### 步骤5：选择计划

- 选择 **"Free"** 免费计划
- 点击 "Create Web Service"

### 步骤6：等待部署

- Render会自动开始部署
- 等待约5-10分钟
- 部署完成后会显示URL

### 步骤7：获取后端URL

- 部署完成后，在服务页面会显示URL
- 类似：`https://tcm-knowledge-graph-backend.onrender.com`
- **复制这个URL**

### 步骤8：更新Vercel

1. 回到Vercel
2. Settings → Environment Variables
3. 编辑 `VITE_API_URL`
4. 更新为：`https://您的Render后端URL/api`
5. 保存并重新部署

---

## ⚠️ Render免费计划限制

- 服务在15分钟无活动后会休眠
- 首次访问需要几秒钟唤醒
- 每月有免费额度限制
- 足够个人项目使用

---

## 🎯 现在操作

### 推荐操作：

1. **访问Render**
   - https://render.com
   - 用GitHub登录

2. **创建Web Service**
   - 按照上面的步骤配置

3. **部署后端**
   - 等待完成
   - 获取URL

4. **更新Vercel**
   - 更新API地址
   - 重新部署

---

## 📝 需要帮助？

如果遇到问题：
1. 告诉我具体步骤
2. 告诉我错误信息
3. 我会继续帮您解决

现在去Render创建服务吧！🚀

