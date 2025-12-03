# 本地部署指南

本文档介绍如何在本地环境部署和运行 TCM Knowledge Graph 项目。

## 环境要求

- **Node.js**: ≥ 18.0
- **pnpm**: ≥ 8.0 (前端)
- **npm**: ≥ 8.0 (后端)
- **Neo4j**: 已配置的 Neo4j Aura 实例或本地 Neo4j 数据库

---

## 快速开始

### 1. 克隆项目（如果还未克隆）

```bash
cd D:\Desktop
# 项目已在 D:\Desktop\tcm-knowledge-graph
```

### 2. 配置后端

```bash
# 进入后端目录
cd D:\Desktop\tcm-knowledge-graph\backend

# 安装依赖
npm install

# 创建环境变量文件（如果不存在）
# 复制 env.example 为 .env
```

**编辑 `backend/.env` 文件**：

```env
# 应用配置
NODE_ENV=development
PORT=3001
API_PREFIX=/api

# Neo4j Aura配置（已有的数据库）
NEO4J_URI=neo4j+s://f36358f7.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=qwertyuiop06
NEO4J_DATABASE=neo4j

# CORS配置（允许本地前端访问）
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# JWT配置
JWT_SECRET=local_dev_jwt_secret_key_for_testing
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=local_dev_refresh_secret_key_for_testing
JWT_REFRESH_EXPIRES_IN=30d

# 日志配置
LOG_LEVEL=info

# 限流配置
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. 配置前端

```bash
# 进入前端目录
cd D:\Desktop\tcm-knowledge-graph\frontend

# 安装依赖
pnpm install

# 创建环境变量文件（如果不存在）
```

**编辑 `frontend/.env.development` 文件**：

```env
# 前端开发环境配置
VITE_API_BASE_URL=http://localhost:3001/api
```

### 4. 启动服务

**开启两个终端窗口：**

#### 终端 1 - 启动后端

```bash
cd D:\Desktop\tcm-knowledge-graph\backend
npm run dev
```

应该看到：

```
[INFO] 🔌 连接Neo4j数据库...
[INFO] ✅ Neo4j连接成功！
[INFO] Server listening on port 3001
```

#### 终端 2 - 启动前端

```bash
cd D:\Desktop\tcm-knowledge-graph\frontend
pnpm dev
```

应该看到：

```
VITE v5.0.8  ready in 1234 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

### 5. 访问应用

在浏览器打开：**http://localhost:3000**

---

## 验证部署

### 检查后端

1. **健康检查**：

```bash
curl http://localhost:3001/health
```

应该返回：

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development",
  "database": "connected"
}
```

2. **API 文档**：

访问：http://localhost:3001/api-docs

3. **测试 API**：

```bash
# 获取统计数据
curl http://localhost:3001/api/stats

# 获取根节点
curl http://localhost:3001/api/nodes/roots
```

### 检查前端

1. 访问 http://localhost:3000
2. 检查控制台是否有错误
3. 测试功能：
   - [ ] 仪表盘数据加载
   - [ ] 搜索功能
   - [ ] 图谱可视化
   - [ ] 节点详情页

---

## 数据导入

如果 Neo4j 数据库是空的，需要导入数据：

### 准备数据集

确保 TCM_Datasets-main 在正确位置：

```bash
# 检查数据集路径
dir D:\Desktop\TCM_Datasets-main\十四五教材
```

应该看到多个 `.md` 文件（中医教材）。

### 运行导入脚本

```bash
cd D:\Desktop\tcm-knowledge-graph\backend

# 方式 1：使用 npm script
npm run import:tcm

# 方式 2：直接运行脚本
node --loader ts-node/esm src/scripts/importTCMDatasets.ts
```

导入过程可能需要 **10-30 分钟**，取决于数据量。

### 验证导入

在 Neo4j Browser 中运行：

```cypher
// 查看节点总数
MATCH (n) RETURN count(n) as totalNodes

// 查看关系总数
MATCH ()-[r]->() RETURN count(r) as totalRelationships

// 查看节点标签分布
MATCH (n)
RETURN DISTINCT labels(n) as labels, count(n) as count
ORDER BY count DESC

// 查看示例节点
MATCH (n)
RETURN n
LIMIT 10
```

---

## 常用开发命令

### 后端命令

```bash
cd D:\Desktop\tcm-knowledge-graph\backend

# 开发模式（自动重启）
npm run dev

# 构建（编译 TypeScript）
npm run build

# 生产模式
npm start

# 类型检查
npm run type-check

# 代码检查
npm run lint

# 修复代码问题
npm run lint:fix

# 运行测试
npm run test

# 监听模式测试
npm run test:watch
```

### 前端命令

```bash
cd D:\Desktop\tcm-knowledge-graph\frontend

# 开发模式
pnpm dev

# 构建
pnpm build

# 预览构建结果
pnpm preview

# 类型检查
pnpm type-check

# 代码检查
pnpm lint
```

---

## 开发工具推荐

### 浏览器扩展

- **React Developer Tools** - 调试 React 组件
- **Redux DevTools** - 如果使用 Redux（当前使用 Zustand）
- **JSON Viewer** - 格式化 JSON 响应

### VS Code 扩展

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-typescript-next",
    "neo4j.neo4j",
    "graphql.vscode-graphql"
  ]
}
```

### Neo4j 工具

- **Neo4j Browser** - Web 界面查询
- **Neo4j Desktop** - 桌面客户端（如果使用本地数据库）
- **Neo4j Bloom** - 可视化探索

---

## 常见问题

### 1. 端口被占用

**问题**：`Error: listen EADDRINUSE: address already in use :::3001`

**解决方案**：

```bash
# Windows - 查找占用端口的进程
netstat -ano | findstr :3001

# 杀死进程（PID 是上面命令的最后一列）
taskkill /PID <PID> /F

# 或者修改端口
# 在 backend/.env 中修改 PORT=3002
# 在 frontend/.env 中修改 API URL
```

### 2. pnpm 未安装

**问题**：`'pnpm' 不是内部或外部命令`

**解决方案**：

```bash
# 全局安装 pnpm
npm install -g pnpm

# 或使用 npx
npx pnpm install
npx pnpm dev
```

### 3. Neo4j 连接失败

**问题**：后端日志显示 `❌ Neo4j连接失败`

**解决方案**：

- 检查网络连接
- 验证 `.env` 中的 Neo4j 配置是否正确
- 确认 Neo4j Aura 实例正在运行
- 检查防火墙设置

### 4. 前端 API 请求失败

**问题**：浏览器控制台显示 `Failed to fetch`

**解决方案**：

- 确认后端已启动（http://localhost:3001/health）
- 检查 `frontend/.env.development` 中的 API URL
- 查看后端日志是否有 CORS 错误
- 清除浏览器缓存

### 5. TypeScript 类型错误

**问题**：编译时出现类型错误

**解决方案**：

```bash
# 前端
cd frontend
pnpm type-check

# 后端
cd backend
npm run type-check

# 如果是依赖问题，重新安装
rm -rf node_modules package-lock.json
npm install  # 或 pnpm install
```

### 6. 样式不生效

**问题**：TailwindCSS 样式不显示

**解决方案**：

```bash
# 重启 Vite 开发服务器
# 检查 tailwind.config.js 配置
# 清除浏览器缓存
```

### 7. 图谱不显示

**问题**：Cytoscape 图谱组件空白

**解决方案**：

- 检查浏览器控制台错误
- 确认后端返回了图谱数据
- 检查 `graphlib` 初始化（`src/utils/graphlib-init.ts`）
- 查看 `vite.config.ts` 中的 chunk 配置

---

## 调试技巧

### 后端调试

1. **使用 VS Code 调试**：

创建 `.vscode/launch.json`：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/backend/src/app.ts",
      "preLaunchTask": "npm: build",
      "outFiles": ["${workspaceFolder}/backend/dist/**/*.js"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

2. **使用 console.log**：

```typescript
import { logger } from '@utils/logger'

logger.info('调试信息', { data: someData })
logger.error('错误信息', error)
```

### 前端调试

1. **React DevTools**：
   - 安装浏览器扩展
   - 检查组件树和 props

2. **网络请求**：
   - 打开浏览器开发者工具 → Network
   - 筛选 XHR/Fetch 请求
   - 查看请求/响应详情

3. **Redux DevTools**（如果使用 Redux）：
   - 查看状态变化
   - 时间旅行调试

### Neo4j 调试

1. **查询分析**：

```cypher
// 查看查询执行计划
PROFILE MATCH (n) RETURN n LIMIT 10

// 查看查询统计
EXPLAIN MATCH (n)-[r]->(m) RETURN count(*)
```

2. **性能监控**：

访问 Neo4j Browser → 查看查询执行时间

---

## 性能优化

### 开发环境优化

1. **启用 Vite HMR**（已启用）
2. **使用 TypeScript 增量编译**（已启用）
3. **减小数据查询限制**：

在开发时使用较小的 `limit` 参数：

```typescript
// 示例：减少节点数量
const { data } = await getGraphData(undefined, 2, 50) // 从 100 改为 50
```

### 内存优化

如果遇到内存问题：

```bash
# 增加 Node.js 内存限制
# 在 package.json 的 script 中添加：
"dev": "NODE_OPTIONS='--max-old-space-size=4096' nodemon src/app.ts"
```

---

## 开发工作流

### 典型开发流程

1. **启动服务**：
   ```bash
   # 终端 1
   cd backend && npm run dev

   # 终端 2
   cd frontend && pnpm dev
   ```

2. **修改代码**：
   - 前端修改会自动热重载（HMR）
   - 后端修改会自动重启（nodemon）

3. **测试更改**：
   - 在浏览器中测试功能
   - 查看控制台和网络请求
   - 运行单元测试

4. **提交代码**：
   ```bash
   git add .
   git commit -m "feat: 添加新功能"
   git push
   ```

### Git 工作流

```bash
# 创建功能分支
git checkout -b feature/new-feature

# 开发功能...

# 提交更改
git add .
git commit -m "feat: 实现新功能"

# 推送到远程
git push origin feature/new-feature

# 创建 Pull Request
```

---

## 停止服务

### 优雅停止

在运行服务的终端中按 `Ctrl + C`

### 强制停止

```bash
# Windows
taskkill /F /IM node.exe

# 或只停止特定端口的进程
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

---

## 下一步

本地部署完成后，你可以：

1. ✅ 浏览和使用应用功能
2. 📝 查看 API 文档（http://localhost:3001/api-docs）
3. 🔍 在 Neo4j Browser 中探索数据
4. 💻 开始开发新功能
5. 📚 阅读代码和架构文档

---

## 获取帮助

- 📖 查看 [README.md](./README.md)
- 🚀 查看 [DEPLOYMENT.md](./DEPLOYMENT.md)（生产部署）
- 📋 查看 [CLAUDE.md](../CLAUDE.md)（项目架构）
- 🐛 提交 Issue
- 💬 联系开发团队

---

<div align="center">

**祝开发愉快！🎉**

[⬆ 回到顶部](#本地部署指南)

</div>
