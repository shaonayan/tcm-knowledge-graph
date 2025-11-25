# 🚂 Railway部署配置步骤

您的项目已在Railway创建，现在需要配置并部署。

---

## 📋 当前状态

- ✅ 项目已创建：`powerful-gratitude`
- ✅ 服务已添加：`tcm-knowledge-graph`
- ⏭️ 需要配置：Root Directory、环境变量、部署

---

## 🔧 步骤1：配置服务设置

### 1.1 打开服务设置

1. **点击服务卡片**
   - 在Architecture视图中，点击 `tcm-knowledge-graph` 卡片
   - 或点击服务名称

2. **进入Settings**
   - 在服务详情页面，点击顶部的 **"Settings"** 标签

### 1.2 配置Root Directory

1. **找到"Source"部分**
   - 在Settings页面中
   - 找到 "Source" 或 "Root Directory" 设置

2. **设置目录**
   - 在 "Root Directory" 输入框中
   - 输入：`backend`
   - 点击 "Save" 或 "Update"

**为什么？** 因为您的后端代码在 `backend` 文件夹中，Railway需要知道从哪里启动服务。

---

## 🔧 步骤2：配置启动命令（可选）

### 2.1 设置Start Command

1. **在Settings页面**
   - 找到 "Deploy" 或 "Start Command" 部分

2. **设置启动命令**
   - 输入：`node server-simple.js`
   - 或：`npm start`
   - 点击保存

**注意：** 如果 `package.json` 中有 `start` 脚本，Railway会自动使用，可能不需要手动设置。

---

## 🔧 步骤3：添加环境变量（重要！）

### 3.1 打开Variables标签

1. **在服务页面**
   - 点击顶部的 **"Variables"** 标签
   - 或点击服务卡片上的设置图标

### 3.2 添加环境变量

点击 "New Variable" 或 "+" 按钮，逐个添加：

#### 变量1：NODE_ENV
```
Name: NODE_ENV
Value: production
```

#### 变量2：PORT
```
Name: PORT
Value: 3001
```

#### 变量3：NEO4J_URI
```
Name: NEO4J_URI
Value: neo4j+s://您的Neo4j地址.databases.neo4j.io
```
**示例：** `neo4j+s://f36358f7.databases.neo4j.io`

#### 变量4：NEO4J_USER
```
Name: NEO4J_USER
Value: neo4j
```

#### 变量5：NEO4J_PASSWORD
```
Name: NEO4J_PASSWORD
Value: 您的Neo4j密码
```
**重要：** 这是您的Neo4j Aura数据库密码

#### 变量6：FRONTEND_URL
```
Name: FRONTEND_URL
Value: https://您的前端地址.vercel.app
```
**示例：** `https://tcm-knowledge-graph-xxx.vercel.app`

### 3.3 保存变量

- 每添加一个变量，点击 "Add" 或 "Save"
- 所有变量添加完成后，Railway会自动重新部署

---

## 🚀 步骤4：触发部署

### 4.1 自动部署

- Railway会在以下情况自动部署：
  - 添加环境变量后
  - 修改设置后
  - GitHub仓库有新的提交

### 4.2 手动触发部署

如果需要手动触发：

1. **在服务页面**
   - 点击 "Deployments" 标签
   - 点击 "Redeploy" 按钮

2. **或使用GitHub**
   - 向GitHub仓库推送任何更改
   - Railway会自动检测并部署

---

## 📊 步骤5：查看部署状态

### 5.1 查看部署日志

1. **点击 "Deployments" 标签**
   - 查看最新的部署
   - 点击部署查看详细日志

2. **查看 "Logs" 标签**
   - 实时查看服务运行日志
   - 检查是否有错误

### 5.2 获取服务URL

1. **在服务页面**
   - 点击 "Settings" → "Networking"
   - 找到 "Public Domain" 或 "Generate Domain"
   - 点击生成公共域名

2. **复制URL**
   - 会生成类似：`https://tcm-knowledge-graph-production-xxx.up.railway.app`
   - **复制这个地址**，稍后需要在Vercel配置

---

## ✅ 步骤6：验证部署

### 6.1 检查服务状态

1. **在Architecture视图**
   - 服务卡片应该显示 "Running" 或绿色状态
   - 不再是 "No deploys"

2. **查看Logs**
   - 点击 "Logs" 标签
   - 应该看到服务启动成功的日志
   - 类似：`Server running on port 3001`

### 6.2 测试API

1. **访问健康检查端点**
   - 在浏览器中访问：`https://您的后端URL/api/health`
   - 或：`https://您的后端URL/api`
   - 应该返回JSON响应

2. **检查CORS**
   - 如果看到CORS错误，说明服务已运行
   - 需要确认 `FRONTEND_URL` 环境变量正确

---

## 🔗 步骤7：连接前后端

### 7.1 更新Vercel环境变量

1. **回到Vercel**
   - 访问：https://vercel.com/dashboard
   - 进入 `tcm-knowledge-graph` 项目

2. **添加API URL**
   - Settings → Environment Variables
   - 添加：
     ```
     Name: VITE_API_URL
     Value: https://您的Railway后端URL/api
     ```
   - 选择所有环境
   - 保存

3. **重新部署**
   - Vercel会自动重新部署
   - 或手动触发Redeploy

### 7.2 更新Railway的FRONTEND_URL

1. **回到Railway**
   - 确认 `FRONTEND_URL` 环境变量正确
   - 应该是您的Vercel前端地址

---

## 📝 快速操作清单

### Railway配置：
- [ ] 点击 `tcm-knowledge-graph` 服务
- [ ] Settings → Root Directory 设置为 `backend`
- [ ] Variables → 添加所有环境变量
- [ ] 等待部署完成
- [ ] 获取公共URL

### 连接配置：
- [ ] 在Vercel添加 `VITE_API_URL`
- [ ] 确认Railway的 `FRONTEND_URL` 正确
- [ ] 重新部署前端

### 测试验证：
- [ ] 检查Railway服务状态为Running
- [ ] 访问后端URL测试API
- [ ] 访问前端URL测试完整功能

---

## ❓ 常见问题

### Q1: 找不到Root Directory设置？
**解决：** 在Settings页面的"Source"部分，可能需要滚动查找

### Q2: 部署失败？
**解决：** 
- 检查Root Directory是否正确（`backend`）
- 确认所有环境变量都已添加
- 查看部署日志中的错误信息

### Q3: 服务一直显示"No deploys"？
**解决：**
- 确认Root Directory已设置
- 添加环境变量触发部署
- 检查GitHub仓库连接

### Q4: 无法生成公共域名？
**解决：**
- 在Settings → Networking中
- 点击 "Generate Domain" 按钮
- 可能需要等待几秒钟

---

## 🎯 现在开始

1. **点击 `tcm-knowledge-graph` 服务卡片**
2. **进入Settings，设置Root Directory为 `backend`**
3. **进入Variables，添加所有环境变量**
4. **等待部署完成**

完成后告诉我，我会帮您继续下一步！💪

