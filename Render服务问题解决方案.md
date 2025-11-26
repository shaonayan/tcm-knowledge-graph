# Render服务连接问题 - 完整解决方案

## 🔴 当前问题

访问 `https://tcm-knowledge-graph.onrender.com/health` 时出现：
- **错误**：`ERR_CONNECTION_CLOSED`
- **提示**：服务关闭了连接

## 🔍 问题诊断

### 可能的原因

1. **服务已停止**
   - Render服务可能已被手动停止
   - 或者因为某些原因自动停止

2. **服务已删除**
   - 服务可能已被删除
   - 需要重新创建

3. **服务配置错误**
   - 服务配置可能有问题
   - 需要检查配置

4. **账户问题**
   - Render账户可能有问题
   - 需要检查账户状态

## ✅ 解决方案

### 方案1：检查并重启Render服务（推荐）

#### 步骤1：登录Render Dashboard
1. 访问：https://dashboard.render.com/
2. 使用你的账户登录

#### 步骤2：检查服务状态
1. 在Dashboard中找到服务：`tcm-knowledge-graph`
2. 查看服务状态：
   - ✅ **Live** - 正常运行
   - ⚠️ **Sleeping** - 休眠中（点击"Wake"唤醒）
   - ❌ **Stopped** - 已停止（点击"Start"启动）
   - 🗑️ **不存在** - 服务已被删除（需要重新创建）

#### 步骤3：重启服务
- 如果服务是 **Sleeping** 或 **Stopped**，点击相应的按钮启动
- 等待1-2分钟让服务完全启动

#### 步骤4：验证服务
访问：https://tcm-knowledge-graph.onrender.com/health
应该返回：`{"status":"ok"}`

### 方案2：重新创建Render服务

如果服务已被删除，需要重新创建：

#### 步骤1：创建新服务
1. 在Render Dashboard点击 **"New +"**
2. 选择 **"Web Service"**

#### 步骤2：连接GitHub仓库
1. 选择你的GitHub账户
2. 选择仓库：`tcm-knowledge-graph`
3. 选择分支：`main`

#### 步骤3：配置服务
```
Name: tcm-knowledge-graph
Environment: Node
Build Command: cd backend && npm install && npm run build
Start Command: cd backend && npm start
```

#### 步骤4：设置环境变量
在 **Environment** 标签中添加：
```
NEO4J_URI=你的Neo4j URI
NEO4J_USER=你的Neo4j用户名
NEO4J_PASSWORD=你的Neo4j密码
NODE_ENV=production
PORT=10000
```

#### 步骤5：部署
1. 点击 **"Create Web Service"**
2. 等待部署完成（约5-10分钟）

### 方案3：使用本地开发（临时方案）

如果Render服务暂时无法使用，可以使用本地开发：

#### 步骤1：启动本地后端
```bash
cd backend
npm install
npm run dev
```

#### 步骤2：配置前端环境变量
创建 `frontend/.env.local` 文件：
```
VITE_API_URL=http://localhost:3001/api
```

#### 步骤3：启动前端
```bash
cd frontend
npm install
npm run dev
```

#### 步骤4：访问应用
打开：http://localhost:5173

### 方案4：使用其他部署平台（长期方案）

如果Render服务持续有问题，可以考虑：

1. **Railway** - https://railway.app/
   - 免费额度更宽松
   - 服务不会休眠

2. **Fly.io** - https://fly.io/
   - 全球部署
   - 免费额度

3. **Heroku** - https://www.heroku.com/
   - 稳定可靠
   - 需要付费

4. **Vercel Serverless Functions**
   - 与前端部署在同一平台
   - 无需单独后端服务

## 🔧 快速检查清单

- [ ] 登录Render Dashboard
- [ ] 检查服务是否存在
- [ ] 检查服务状态
- [ ] 如果停止，启动服务
- [ ] 如果删除，重新创建
- [ ] 检查环境变量配置
- [ ] 查看部署日志
- [ ] 验证健康检查端点

## 📊 服务状态说明

### Live（运行中）
- ✅ 服务正常运行
- ✅ 可以正常访问
- ⚠️ 免费计划会在15分钟无活动后休眠

### Sleeping（休眠中）
- ⚠️ 服务已休眠
- ✅ 点击"Wake"可以唤醒
- ⏱️ 首次访问需要30-60秒唤醒

### Stopped（已停止）
- ❌ 服务已手动停止
- ✅ 点击"Start"可以启动
- ⏱️ 启动需要1-2分钟

### 不存在
- ❌ 服务已被删除
- ✅ 需要重新创建服务

## 🎯 推荐操作流程

1. **立即检查**：登录Render Dashboard查看服务状态
2. **如果停止**：点击启动按钮
3. **如果删除**：按照方案2重新创建
4. **如果持续问题**：考虑使用方案4迁移到其他平台

## ⚠️ 重要提示

1. **免费计划限制**：
   - 服务会在15分钟无活动后休眠
   - 首次访问需要30-60秒唤醒
   - 每月有使用限制

2. **环境变量**：
   - 确保所有必要的环境变量都已设置
   - 特别是Neo4j连接信息

3. **构建配置**：
   - 确保Build Command和Start Command正确
   - 检查package.json中的脚本

4. **日志检查**：
   - 查看部署日志了解错误信息
   - 检查运行时日志

## 📝 下一步

1. ✅ 登录Render Dashboard检查服务状态
2. ✅ 根据状态采取相应措施
3. ✅ 如果服务正常，等待1-2分钟后再访问
4. ✅ 如果问题持续，考虑重新创建服务或迁移平台

完成以上步骤后，服务应该能够正常连接。

