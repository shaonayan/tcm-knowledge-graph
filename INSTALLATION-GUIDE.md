# Node.js 安装与项目依赖配置指南

## 🚀 第一步：安装Node.js

### 下载Node.js

1. **访问官方网站**: https://nodejs.org/
2. **选择LTS版本** (推荐 18.x 或 20.x)
3. **下载Windows安装包** (.msi文件)

### 安装步骤

1. **运行安装程序**
   - 双击下载的.msi文件
   - 选择"Next"继续

2. **接受许可协议**
   - 勾选"I accept the terms in the License Agreement"
   - 点击"Next"

3. **选择安装路径**
   - 使用默认路径：`C:\Program Files\nodejs\`
   - 点击"Next"

4. **自定义安装**
   - 保持默认选择（包含npm包管理器）
   - 确保勾选"Add to PATH"
   - 点击"Next"

5. **完成安装**
   - 点击"Install"
   - 等待安装完成
   - 点击"Finish"

### 验证安装

安装完成后，打开**新的命令提示符**或PowerShell窗口：

```bash
# 检查Node.js版本
node --version
# 应该显示：v18.x.x 或 v20.x.x

# 检查npm版本  
npm --version
# 应该显示：8.x.x 或更高版本
```

## 📦 第二步：安装项目依赖

### 进入项目目录

```bash
# 确保在正确的项目目录
cd C:\Users\31600\Desktop\tcm-knowledge-graph
```

### 安装前端依赖

```bash
# 进入前端目录
cd frontend

# 安装依赖（这可能需要几分钟）
npm install
```

**前端依赖包括**：
- React 18 + TypeScript
- Vite (构建工具)
- Ant Design (UI组件库)
- Tailwind CSS (样式框架)
- D3.js + Cytoscape.js (图谱可视化)
- Zustand (状态管理)
- React Query (服务器状态)
- Axios (HTTP客户端)

### 安装后端依赖

```bash
# 回到项目根目录，然后进入后端目录
cd ../backend

# 安装依赖
npm install
```

**后端依赖包括**：
- Express + TypeScript
- Neo4j Driver
- Redis (ioredis)
- JWT认证
- Swagger文档
- Winston日志
- 各种中间件和工具

## 🔧 第三步：验证安装

### 检查前端依赖

```bash
# 在frontend目录下
cd frontend
npm list --depth=0
```

### 检查后端依赖

```bash
# 在backend目录下  
cd ../backend
npm list --depth=0
```

## ⚡ 第四步：配置开发环境

### 创建后端环境文件

```bash
# 在backend目录下
cd backend
copy env.example .env
```

### 编辑环境配置

打开 `backend/.env` 文件，配置以下信息：

```env
# 应用配置
NODE_ENV=development
PORT=3001

# Neo4j配置（连接您现有的数据库）
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=您的Neo4j密码

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT密钥（请更改为随机字符串）
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

## 🚀 第五步：启动开发服务器

### 启动后端服务

```bash
# 在backend目录下
cd backend
npm run dev
```

**预期输出**：
```
🚀 服务器启动成功
📍 端口: 3001
🌐 环境: development
📚 API文档: http://localhost:3001/api-docs
💚 健康检查: http://localhost:3001/health
```

### 启动前端服务

**打开新的命令行窗口**：

```bash
# 进入前端目录
cd C:\Users\31600\Desktop\tcm-knowledge-graph\frontend

# 启动开发服务器
npm run dev
```

**预期输出**：
```
  VITE v5.0.8  ready in 1234 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

## 🌐 第六步：访问应用

- **前端应用**: http://localhost:3000
- **后端API**: http://localhost:3001
- **API文档**: http://localhost:3001/api-docs
- **健康检查**: http://localhost:3001/health

## ❗ 常见问题解决

### 问题1：npm命令不存在
**解决方案**：
- 重新安装Node.js
- 确保勾选"Add to PATH"
- 重启命令行窗口

### 问题2：权限错误
**解决方案**：
```bash
# 以管理员身份运行命令行
# 或者配置npm全局目录
npm config set prefix "C:\Users\31600\AppData\Roaming\npm"
```

### 问题3：网络连接问题
**解决方案**：
```bash
# 使用国内镜像源
npm config set registry https://registry.npmmirror.com/

# 然后重新安装
npm install
```

### 问题4：端口占用
**解决方案**：
```bash
# 检查端口占用
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# 杀死占用进程
taskkill /PID <进程ID> /F
```

## ✅ 安装完成检查清单

- [ ] Node.js 已安装并可以运行 `node --version`
- [ ] npm 已安装并可以运行 `npm --version`  
- [ ] 前端依赖已安装 (`frontend/node_modules` 目录存在)
- [ ] 后端依赖已安装 (`backend/node_modules` 目录存在)
- [ ] 环境配置文件已创建 (`backend/.env` 存在)
- [ ] 后端服务可以启动 (http://localhost:3001)
- [ ] 前端服务可以启动 (http://localhost:3000)

## 🎯 下一步

安装完成后，您就可以：

1. **连接Neo4j数据库** - 配置您现有的中医知识图谱数据
2. **开发API接口** - 创建图谱查询和分析接口  
3. **实现前端组件** - 构建可视化和交互功能
4. **测试和优化** - 确保应用性能和用户体验

现在开始安装Node.js吧！🚀
