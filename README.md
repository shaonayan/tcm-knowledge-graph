# 中医知识图谱 TCM Knowledge Graph

<div align="center">

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/username/tcm-knowledge-graph)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Neo4j](https://img.shields.io/badge/Neo4j-5.15-008CC1?logo=neo4j)](https://neo4j.com/)

一个基于图数据库的中医知识图谱可视化与分析平台

[在线演示](https://tcm-knowledge-graph.vercel.app) · [API 文档](https://tcm-knowledge-graph.onrender.com/api-docs)

</div>

---

## 📋 目录

- [项目简介](#项目简介)
- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [项目结构](#项目结构)
- [开发指南](#开发指南)
- [API 文档](#api-文档)
- [部署说明](#部署说明)
- [贡献指南](#贡献指南)

---

## 项目简介

中医知识图谱是一个专注于中医领域的知识图谱可视化与智能分析平台。项目基于 Neo4j 图数据库，整合了中医十四五教材的结构化数据，提供多维度的知识图谱可视化、智能搜索和数据分析功能。

### 核心价值

- 🏥 **中医知识结构化**：将传统中医知识以图谱形式组织，揭示知识之间的关联
- 🔍 **智能搜索**：快速检索中医实体（方剂、穴位、症状等）及其关系
- 📊 **多维可视化**：支持 2D/3D 图谱、关系网络、时间演进等多种可视化方式
- 🤖 **AI 辅助**：集成智能代理，提供知识问答和路径分析
- 📈 **数据分析**：提供中心度、路径、邻居等图分析算法

---

## 功能特性

### 🗺️ 知识图谱可视化

- **一元图谱**：实体节点展示
- **二元图谱**：实体关系网络
- **三元图谱**：实体-关系-属性三元组
- **3D 图谱**：基于 Three.js 的 3D 立体展示
- **Cytoscape 图谱**：支持拖拽、缩放、布局调整

### 🔎 搜索与浏览

- 全文搜索：支持节点名称、编码、分类搜索
- 智能过滤：按分类、层级筛选
- 节点详情：查看节点属性、父子关系、连接数
- 路径查找：查找两个节点之间的最短路径

### 📊 数据分析

- **统计概览**：节点数、关系数、分类统计
- **层级分析**：知识层级分布
- **中心度分析**：度中心度、介数中心度、接近中心度
- **邻居分析**：查看节点的邻居关系网络
- **维度分析**：多维度数据对比

### 🎨 可视化组件

- **时间轴图谱**：展示知识演进历程
- **演化图谱**：动态展示知识图谱变化
- **力导向图**：基于 D3.js 的力导向布局
- **ECharts 图表**：统计图表、关系图

---

## 技术栈

### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.2 | UI 框架 |
| TypeScript | 5.2 | 类型系统 |
| Vite | 5.0 | 构建工具 |
| Ant Design | 5.12 | UI 组件库 |
| TailwindCSS | 3.3 | CSS 框架 |
| Zustand | 4.4 | 状态管理 |
| React Query | 5.8 | 数据获取 |
| Cytoscape.js | 3.26 | 图谱可视化 |
| D3.js | 7.8 | 数据可视化 |
| ECharts | 5.4 | 图表库 |
| Three.js | 0.159 | 3D 渲染 |
| React Router | 6.8 | 路由管理 |

### 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | ≥18.0 | 运行环境 |
| Express.js | 4.18 | Web 框架 |
| TypeScript | 5.3 | 类型系统 |
| Neo4j Driver | 5.15 | 图数据库驱动 |
| Passport.js | 0.7 | 认证中间件 |
| Winston | 3.11 | 日志管理 |
| Swagger | 6.2 | API 文档 |
| Jest | 29.7 | 测试框架 |

### 数据库与部署

- **Neo4j Aura**：托管图数据库
- **Vercel**：前端部署
- **Render**：后端部署

---

## 快速开始

### 环境要求

- Node.js ≥ 18.0
- pnpm ≥ 8.0 (前端)
- npm ≥ 8.0 (后端)
- Neo4j 数据库（本地或 Aura）

### 安装依赖

```bash
# 克隆仓库
git clone https://github.com/username/tcm-knowledge-graph.git
cd tcm-knowledge-graph

# 安装前端依赖
cd frontend
pnpm install

# 安装后端依赖
cd ../backend
npm install
```

### 配置环境变量

**前端** - 创建 `frontend/.env.development`：

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

**后端** - 创建 `backend/.env`（参考 `env.example`）：

```env
NODE_ENV=development
PORT=3001
API_PREFIX=/api

# Neo4j 配置
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
NEO4J_DATABASE=neo4j

# CORS 配置
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true
```

### 启动开发服务器

```bash
# 启动后端 (终端 1)
cd backend
npm run dev
# 后端运行在 http://localhost:3001

# 启动前端 (终端 2)
cd frontend
pnpm dev
# 前端运行在 http://localhost:3000
```

### 导入数据

```bash
# 在 backend 目录下
npm run import:tcm
```

---

## 项目结构

```
tcm-knowledge-graph/
├── frontend/                    # 前端项目
│   ├── src/
│   │   ├── components/         # React 组件
│   │   │   ├── common/         # 通用组件
│   │   │   ├── graph/          # 图谱可视化组件
│   │   │   ├── agent/          # AI 代理组件
│   │   │   └── analysis/       # 分析组件
│   │   ├── pages/              # 页面组件
│   │   │   ├── Dashboard/      # 仪表盘
│   │   │   ├── Explorer/       # 探索页
│   │   │   ├── Analytics/      # 分析页
│   │   │   ├── Visualizations/ # 可视化页
│   │   │   └── NodeDetail/     # 节点详情页
│   │   ├── services/           # API 服务
│   │   │   ├── api.ts          # REST API
│   │   │   └── agent.ts        # AI 代理服务
│   │   ├── utils/              # 工具函数
│   │   ├── types/              # TypeScript 类型
│   │   └── main.tsx            # 入口文件
│   ├── public/                 # 静态资源
│   ├── vite.config.ts          # Vite 配置
│   ├── tailwind.config.js      # TailwindCSS 配置
│   └── package.json
│
├── backend/                     # 后端项目
│   ├── src/
│   │   ├── routes/             # API 路由
│   │   │   ├── graph.ts        # 图谱 API
│   │   │   ├── search.ts       # 搜索 API
│   │   │   ├── analytics.ts    # 分析 API
│   │   │   ├── agent.ts        # AI 代理 API
│   │   │   └── import.ts       # 数据导入 API
│   │   ├── services/           # 业务逻辑
│   │   │   └── neo4j.ts        # Neo4j 服务
│   │   ├── middleware/         # 中间件
│   │   │   ├── errorHandler.ts # 错误处理
│   │   │   └── notFoundHandler.ts
│   │   ├── utils/              # 工具
│   │   │   └── logger.ts       # 日志工具
│   │   ├── config/             # 配置
│   │   │   └── neo4j.ts        # Neo4j 配置
│   │   ├── scripts/            # 脚本
│   │   │   └── importTCMDatasets.ts
│   │   └── app.ts              # Express 应用
│   ├── tsconfig.json           # TypeScript 配置
│   └── package.json
│
├── vercel.json                  # Vercel 部署配置
└── README.md                    # 项目文档
```

---

## 开发指南

### 前端开发

```bash
cd frontend

# 开发
pnpm dev                # 启动开发服务器
pnpm build              # 生产构建
pnpm preview            # 预览生产构建
pnpm type-check         # TypeScript 类型检查
pnpm lint               # ESLint 检查
```

**路径别名**：

- `@/*` → `src/*`
- `@components/*` → `src/components/*`
- `@pages/*` → `src/pages/*`
- `@services/*` → `src/services/*`
- `@utils/*` → `src/utils/*`

### 后端开发

```bash
cd backend

# 开发
npm run dev             # 启动开发服务器 (nodemon)
npm run build           # TypeScript 编译
npm start               # 启动生产服务器
npm run test            # 运行测试
npm run test:watch      # 监听模式测试
npm run lint            # ESLint 检查
npm run lint:fix        # 自动修复 lint 问题
npm run type-check      # TypeScript 类型检查
```

**路径别名**：

- `@/*` → `src/*`
- `@routes/*` → `src/routes/*`
- `@services/*` → `src/services/*`
- `@middleware/*` → `src/middleware/*`
- `@utils/*` → `src/utils/*`

### 数据导入

```bash
cd backend
npm run import:tcm
```

该脚本会从 `TCM_Datasets-main` 读取中医教材数据并导入到 Neo4j。

---

## API 文档

### 基础信息

- **Base URL**: `http://localhost:3001/api` (开发环境)
- **生产 URL**: `https://tcm-knowledge-graph.onrender.com/api`
- **Swagger 文档**: `/api-docs`

### 主要端点

#### 统计数据

```http
GET /api/stats
```

返回节点数、关系数、标签统计等。

#### 节点操作

```http
GET /api/nodes/roots              # 获取根节点
GET /api/nodes/:code              # 获取节点详情
```

#### 搜索

```http
GET /api/search?q={query}&category={category}&limit={limit}
```

#### 图谱数据

```http
GET /api/graph?rootCode={code}&depth={depth}&limit={limit}  # 二元图谱
GET /api/graph/unary?limit={limit}                          # 一元图谱
GET /api/graph/binary?rootCode={code}&depth={depth}         # 二元图谱
GET /api/graph/ternary?limit={limit}                        # 三元图谱
GET /api/graph/expand/:code?depth={depth}&limit={limit}     # 展开节点
```

#### 分析

```http
GET /api/analytics/overview       # 分析概览
GET /api/analytics/top-level      # 顶层分类统计
GET /api/analysis/path            # 路径分析
GET /api/analysis/centrality      # 中心度分析
GET /api/analysis/neighbors       # 邻居分析
```

#### 健康检查

```http
GET /health
```

---

## 部署说明

### 前端部署 (Vercel)

1. 连接 GitHub 仓库到 Vercel
2. 设置构建配置：
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. 配置环境变量：
   - `VITE_API_BASE_URL`: 后端 API 地址

### 后端部署 (Render)

1. 创建新的 Web Service
2. 连接 GitHub 仓库
3. 设置配置：
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. 配置环境变量：
   - `NEO4J_URI`
   - `NEO4J_USER`
   - `NEO4J_PASSWORD`
   - `CORS_ORIGIN`

### Neo4j Aura

1. 创建 Neo4j Aura 实例
2. 记录连接信息（URI、用户名、密码）
3. 配置到后端环境变量
4. 运行数据导入脚本

---

## 贡献指南

欢迎贡献代码、报告问题或提出建议！

### 提交 Issue

- 使用清晰的标题描述问题
- 提供复现步骤
- 包含环境信息（Node.js 版本、浏览器等）

### 提交 Pull Request

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范

- 遵循 ESLint 配置
- 使用 TypeScript 严格模式
- 编写单元测试
- 提交前运行 `pnpm type-check` 和 `pnpm lint`

---

## 许可证

本项目基于 MIT 许可证开源。详见 [LICENSE](LICENSE) 文件。

---

## 致谢

- 数据来源：[TCM_Datasets](https://github.com/username/TCM_Datasets) - 中医十四五教材数据集
- 图数据库：[Neo4j](https://neo4j.com/)
- UI 组件：[Ant Design](https://ant.design/)
- 图谱可视化：[Cytoscape.js](https://js.cytoscape.org/)

---

<div align="center">

**[⬆ 回到顶部](#中医知识图谱-tcm-knowledge-graph)**

Made with ❤️ by TCM Knowledge Graph Team

</div>