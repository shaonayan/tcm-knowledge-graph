# 部署指南

本文档详细说明如何部署中医知识图谱项目到生产环境。

## 📋 部署架构

根据项目配置，推荐部署方案如下：

- **前端**: Vercel（静态网站托管）
- **后端**: Render（Node.js Web Service）
- **数据库**: Neo4j Aura（托管图数据库）

## 🚀 部署步骤

### 1. 数据库部署（Neo4j Aura）

#### 1.1 创建 Neo4j Aura 实例

1. 访问 [Neo4j Aura](https://neo4j.com/cloud/aura/)
2. 注册/登录账号
3. 创建新的数据库实例
4. 选择免费套餐（Free Tier）或付费套餐
5. 记录连接信息：
   - URI（格式：`neo4j+s://xxxxx.databases.neo4j.io`）
   - 用户名（通常是 `neo4j`）
   - 密码（创建时设置）

#### 1.2 导入数据

在本地运行数据导入脚本：

```bash
cd backend
npm install
npm run import:tcm
```

确保 `.env` 文件配置了正确的 Neo4j 连接信息。

---

### 2. 后端部署（Render）

#### 2.1 准备 GitHub 仓库

确保代码已推送到 GitHub 仓库。

#### 2.2 在 Render 创建 Web Service

1. 访问 [Render Dashboard](https://dashboard.render.com/)
2. 点击 "New +" → "Web Service"
3. 连接你的 GitHub 仓库
4. 选择仓库 `tcm-knowledge-graph`

#### 2.3 配置服务

**基本信息**：
- **Name**: `tcm-knowledge-graph-backend`（或自定义）
- **Region**: 选择离用户最近的区域（如 `Singapore`）
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**环境变量**：
在 "Environment Variables" 中添加：

```env
NODE_ENV=production
PORT=10000
API_PREFIX=/api

# Neo4j 配置（使用 Aura 连接信息）
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
NEO4J_DATABASE=neo4j

# CORS 配置（前端域名）
CORS_ORIGIN=https://your-frontend-domain.vercel.app
CORS_CREDENTIALS=true

# 日志配置
LOG_LEVEL=info

# JWT 配置（生成随机密钥）
JWT_SECRET=your_long_random_secret_key_here
JWT_EXPIRES_IN=7d
```

**重要提示**：
- Render 会自动分配端口，使用环境变量 `PORT`（通常为 10000）
- 确保 `CORS_ORIGIN` 设置为前端部署后的域名
- `JWT_SECRET` 应使用强随机字符串

#### 2.4 部署

1. 点击 "Create Web Service"
2. Render 会自动开始构建和部署
3. 等待部署完成（通常 5-10 分钟）
4. 记录服务 URL（格式：`https://tcm-knowledge-graph.onrender.com`）

#### 2.5 验证后端

访问健康检查端点：
```
https://your-backend-url.onrender.com/health
```

应该返回 `OK` 或 `healthy`。

---

### 3. 前端部署（Vercel）

#### 3.1 准备 GitHub 仓库

确保代码已推送到 GitHub 仓库。

#### 3.2 在 Vercel 创建项目

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "Add New..." → "Project"
3. 导入 GitHub 仓库 `tcm-knowledge-graph`

#### 3.3 配置项目

**项目设置**：
- **Framework Preset**: `Vite`
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`（或 `pnpm build`）
- **Output Directory**: `dist`
- **Install Command**: `npm install`（或 `pnpm install`）

**环境变量**：
在 "Environment Variables" 中添加：

```env
VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
```

**重要提示**：
- 将 `your-backend-url.onrender.com` 替换为实际的后端 Render URL
- 确保 URL 以 `/api` 结尾（代码会自动处理）

#### 3.4 部署

1. 点击 "Deploy"
2. Vercel 会自动构建和部署
3. 等待部署完成（通常 2-5 分钟）
4. 记录部署 URL（格式：`https://tcm-knowledge-graph.vercel.app`）

#### 3.5 更新后端 CORS

部署完成后，更新后端环境变量中的 `CORS_ORIGIN`：

```env
CORS_ORIGIN=https://your-frontend-url.vercel.app
```

然后重新部署后端服务。

---

### 4. 验证部署

#### 4.1 检查前端

1. 访问前端 URL
2. 打开浏览器开发者工具（F12）
3. 查看 Console，应该看到：
   ```
   🌐 当前API基础URL: https://your-backend-url.onrender.com/api
   ```
4. 测试主要功能：
   - 搜索节点
   - 查看图谱
   - 访问分析页面

#### 4.2 检查后端

1. 访问后端健康检查：
   ```
   https://your-backend-url.onrender.com/health
   ```
2. 访问 API 文档（如果配置了 Swagger）：
   ```
   https://your-backend-url.onrender.com/api-docs
   ```
3. 测试 API 端点：
   ```
   https://your-backend-url.onrender.com/api/stats
   ```

---

## 🐳 Docker 部署（可选）

如果需要在自己的服务器上使用 Docker 部署，可以使用 `docker-compose.yml`。

### 前置要求

- Docker 和 Docker Compose
- Neo4j Aura 连接信息

### 部署步骤

1. **配置环境变量**

   在项目根目录创建 `.env` 文件：

   ```env
   NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=your_password
   ```

2. **构建和启动**

   ```bash
   docker-compose up -d --build
   ```

3. **访问服务**

   - 前端: http://localhost:3003
   - 后端: http://localhost:3004

---

## 🔧 故障排查

### 前端无法连接后端

1. **检查环境变量**
   - 确认 `VITE_API_BASE_URL` 已正确设置
   - 确认 URL 格式正确（包含 `https://` 和 `/api`）

2. **检查 CORS 配置**
   - 确认后端 `CORS_ORIGIN` 包含前端域名
   - 检查浏览器控制台的 CORS 错误信息

3. **检查网络**
   - 确认后端服务正在运行
   - 测试后端健康检查端点

### 后端无法连接数据库

1. **检查 Neo4j 连接信息**
   - 确认 URI、用户名、密码正确
   - 确认数据库实例正在运行

2. **检查防火墙**
   - Neo4j Aura 需要允许来自 Render 的 IP 连接
   - 检查 Aura 的 IP 白名单设置

### Render 服务休眠

Render 免费套餐的服务会在 15 分钟无活动后休眠。首次访问需要等待 30-60 秒唤醒。

解决方案：
- 使用付费套餐（避免休眠）
- 设置自动唤醒脚本（使用 cron job 定期 ping）

---

## 📝 更新部署

### 更新代码

1. 推送代码到 GitHub
2. Vercel 和 Render 会自动检测并重新部署
3. 等待部署完成

### 手动触发部署

**Vercel**:
- Dashboard → Project → Deployments → "Redeploy"

**Render**:
- Dashboard → Service → "Manual Deploy" → "Deploy latest commit"

---

## 🔐 安全建议

1. **环境变量**
   - 不要在代码中硬编码敏感信息
   - 使用环境变量存储密钥和密码
   - 定期轮换 JWT Secret

2. **HTTPS**
   - Vercel 和 Render 默认提供 HTTPS
   - 确保所有 API 调用使用 HTTPS

3. **CORS**
   - 仅允许必要的域名访问 API
   - 不要使用 `*` 作为 CORS 源

4. **数据库**
   - 使用强密码
   - 定期备份数据
   - 限制数据库访问 IP（如果可能）

---

## 📚 相关文档

- [Vercel 文档](https://vercel.com/docs)
- [Render 文档](https://render.com/docs)
- [Neo4j Aura 文档](https://neo4j.com/docs/aura/)
- [项目 README](./README.md)

---

## 🆘 获取帮助

如果遇到问题：

1. 查看项目 [Issues](https://github.com/username/tcm-knowledge-graph/issues)
2. 检查日志：
   - Vercel: Dashboard → Project → Deployments → Logs
   - Render: Dashboard → Service → Logs
3. 查看浏览器控制台和网络请求

---

**最后更新**: 2024年

