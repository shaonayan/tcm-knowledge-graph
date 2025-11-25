# ⚙️ Render配置详细步骤

您的GitHub仓库已连接！现在需要配置服务设置。

---

## 🎯 需要配置的项目

### 1. Root Directory（重要！）

1. **找到"Root Directory"输入框**
   - 在配置页面中
   - 找到 "Root Directory (Optional)" 部分

2. **输入目录**
   - 在输入框中输入：`backend`
   - 这样Render知道从哪个目录启动服务

---

### 2. Build Command（构建命令）

1. **找到"Build Command"输入框**
   - 当前显示：`$ yarn`

2. **修改为：**
   - 输入：`npm install`
   - 或留空（Render会自动检测）

---

### 3. Start Command（启动命令）

1. **找到"Start Command"输入框**
   - 当前显示：`$ yarn start`

2. **修改为：**
   - 输入：`node server-simple.js`
   - 这是您的后端启动命令

---

### 4. 添加环境变量（重要！）

1. **找到"Environment Variables"部分**
   - 在配置页面中向下滚动

2. **点击"+ Add Environment Variable"按钮**

3. **逐个添加以下6个变量：**

#### 变量1：NODE_ENV
- **NAME**: `NODE_ENV`
- **value**: `production`
- 点击添加

#### 变量2：PORT
- **NAME**: `PORT`
- **value**: `3001`
- 点击添加

#### 变量3：NEO4J_URI
- **NAME**: `NEO4J_URI`
- **value**: `neo4j+s://f36358f7.databases.neo4j.io`
- 点击添加

#### 变量4：NEO4J_USER
- **NAME**: `NEO4J_USER`
- **value**: `neo4j`
- 点击添加

#### 变量5：NEO4J_PASSWORD
- **NAME**: `NEO4J_PASSWORD`
- **value**: `RWXciE-YrfUELz2i36U_0L80MFD0gpYtEHroztDJb_U`
- 点击添加

#### 变量6：FRONTEND_URL
- **NAME**: `FRONTEND_URL`
- **value**: `https://tcm-knowledge-graph-jr76.vercel.app`
- 点击添加

---

### 5. 选择计划

1. **在"Instance Type"部分**
   - 选择 **"Free"** 免费计划
   - 显示：`$0/month`

2. **注意免费计划的限制：**
   - 服务在15分钟无活动后会休眠
   - 首次访问需要几秒钟唤醒
   - 足够个人项目使用

---

### 6. 部署

1. **检查所有配置**
   - ✅ Root Directory: `backend`
   - ✅ Build Command: `npm install`
   - ✅ Start Command: `node server-simple.js`
   - ✅ 6个环境变量都已添加
   - ✅ 选择Free计划

2. **点击"Deploy Web Service"按钮**
   - 在页面底部
   - 黑色按钮

3. **等待部署**
   - Render会自动开始部署
   - 等待约5-10分钟
   - 可以在部署日志中查看进度

---

## 📋 配置检查清单

### 必须配置的项目：

- [ ] **Root Directory**: `backend`
- [ ] **Build Command**: `npm install`（或留空）
- [ ] **Start Command**: `node server-simple.js`
- [ ] **NODE_ENV**: `production`
- [ ] **PORT**: `3001`
- [ ] **NEO4J_URI**: `neo4j+s://f36358f7.databases.neo4j.io`
- [ ] **NEO4J_USER**: `neo4j`
- [ ] **NEO4J_PASSWORD**: `RWXciE-YrfUELz2i36U_0L80MFD0gpYtEHroztDJb_U`
- [ ] **FRONTEND_URL**: `https://tcm-knowledge-graph-jr76.vercel.app`
- [ ] **计划**: Free

---

## 🎯 现在立即操作

### 步骤1：配置Root Directory
1. 找到 "Root Directory" 输入框
2. 输入：`backend`

### 步骤2：修改Build Command
1. 找到 "Build Command" 输入框
2. 修改为：`npm install`（或留空）

### 步骤3：修改Start Command
1. 找到 "Start Command" 输入框
2. 修改为：`node server-simple.js`

### 步骤4：添加环境变量
1. 找到 "Environment Variables" 部分
2. 点击 "+ Add Environment Variable"
3. 逐个添加6个环境变量

### 步骤5：选择计划并部署
1. 选择 "Free" 计划
2. 点击 "Deploy Web Service"
3. 等待部署完成

---

## ⚠️ 重要提示

### Root Directory必须设置！

如果不设置Root Directory，Render会在项目根目录查找代码，但您的后端代码在 `backend` 文件夹中，所以必须设置为 `backend`。

---

## 🚀 部署完成后

部署完成后，Render会显示：
- 服务URL（类似：`https://tcm-knowledge-graph.onrender.com`）
- 部署状态
- 日志信息

**下一步：**
1. 复制后端URL
2. 在Vercel更新 `VITE_API_URL`
3. 重新部署前端
4. 测试网站

---

现在按照上面的步骤配置，完成后告诉我！💪

