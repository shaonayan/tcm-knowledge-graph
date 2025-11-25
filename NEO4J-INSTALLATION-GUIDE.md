# Neo4j数据库安装与配置指南

## 🎯 推荐方案选择

根据您的需求，我推荐以下安装方案：

### 方案1：Neo4j Desktop（推荐新手）
- ✅ 图形界面，易于使用
- ✅ 内置浏览器和管理工具
- ✅ 适合开发和学习

### 方案2：Neo4j Aura（云服务，推荐）
- ✅ 无需本地安装
- ✅ 免费层可用
- ✅ 自动备份和维护
- ✅ 您之前已经使用过

### 方案3：Docker安装（推荐开发者）
- ✅ 轻量级，易于管理
- ✅ 版本控制方便
- ✅ 与项目集成度高

## 🚀 方案1：Neo4j Desktop安装

### 下载安装
1. **访问官网**: https://neo4j.com/download/
2. **选择Neo4j Desktop**
3. **填写信息获取激活密钥**
4. **下载Windows版本**

### 安装步骤
1. **运行安装程序**
2. **输入激活密钥**
3. **创建新项目**
4. **创建本地数据库**
   - 数据库名称: `tcm-knowledge-graph`
   - 密码: 设置一个强密码
   - Neo4j版本: 5.x（最新稳定版）

### 导入您的数据
```cypher
// 1. 首先清空数据库（如果需要）
MATCH (n) DETACH DELETE n

// 2. 导入您的CSV数据
LOAD CSV WITH HEADERS FROM 'file:///中医病证分类与代码_精细清理版.csv' AS row
CREATE (n:TCM_Term {
  代码: row.代码,
  分类层级: toInteger(row.分类层级),
  主要术语: row.主要术语,
  同义词1: row.同义词1,
  同义词2: row.同义词2,
  同义词3: row.同义词3,
  同义词4: row.同义词4,
  同义词5: row.同义词5,
  类别: row.类别
})

// 3. 创建层次关系
MATCH (parent), (child)
WITH parent, child, keys(parent)[0] as codeKey
WHERE parent[codeKey] IS NOT NULL 
  AND child[codeKey] IS NOT NULL
  AND toString(child[codeKey]) STARTS WITH toString(parent[codeKey])
  AND size(toString(child[codeKey])) > size(toString(parent[codeKey]))
CREATE (parent)-[:包含]->(child)
```

## ☁️ 方案2：Neo4j Aura（推荐）

### 创建免费实例
1. **访问**: https://neo4j.com/cloud/aura/
2. **注册/登录账户**
3. **创建免费实例**
   - 实例名称: `TCM-Knowledge-Graph`
   - 区域: 选择离您最近的
   - 数据库名称: `neo4j`

### 获取连接信息
创建后您会得到：
```
URI: neo4j+s://xxxxxxxx.databases.neo4j.io
Username: neo4j
Password: [生成的密码]
```

### 导入数据
1. **上传CSV文件到Aura**
2. **使用Neo4j Browser执行导入查询**
3. **或使用我们的Web应用导入**

## 🐳 方案3：Docker安装（快速）

### 使用Docker Compose
我们的项目已经包含了Docker配置，直接运行：

```bash
# 在项目根目录
docker-compose up neo4j -d
```

这将启动：
- Neo4j数据库 (端口7474/7687)
- 默认用户名: neo4j
- 默认密码: tcm123456

### 手动Docker安装
```bash
# 拉取Neo4j镜像
docker pull neo4j:5.15-community

# 运行Neo4j容器
docker run -d \
  --name neo4j-tcm \
  -p 7474:7474 -p 7687:7687 \
  -e NEO4J_AUTH=neo4j/tcm123456 \
  -e NEO4J_PLUGINS='["apoc"]' \
  -v neo4j_data:/data \
  neo4j:5.15-community
```

## 📊 数据导入方案

### 方案A：使用现有CSV文件
您已经有清理好的CSV文件：`中医病证分类与代码_精细清理版.csv`

### 方案B：直接连接现有数据库
如果您之前在Neo4j Aura中已经有数据，直接使用连接信息即可。

### 方案C：使用我们的Web应用导入
我们可以开发一个数据导入功能，通过Web界面导入。

## 🔧 配置Web应用连接

无论选择哪种方案，最后都需要在 `backend/.env` 文件中配置：

### Neo4j Desktop配置
```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=您设置的密码
NEO4J_DATABASE=neo4j
```

### Neo4j Aura配置
```env
NEO4J_URI=neo4j+s://xxxxxxxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=生成的密码
NEO4J_DATABASE=neo4j
```

### Docker配置
```env
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=tcm123456
NEO4J_DATABASE=neo4j
```

## 🎯 我的推荐

基于您的情况，我推荐：

### 1. **立即开始开发** - 使用Docker
```bash
# 在tcm-knowledge-graph目录
docker-compose up neo4j redis -d
```
- 5分钟内可用
- 无需额外下载
- 与项目完美集成

### 2. **长期使用** - Neo4j Aura
- 免费且稳定
- 无需维护
- 云端备份

### 3. **深度学习** - Neo4j Desktop
- 完整功能
- 本地控制
- 学习Neo4j最佳选择

## 🚀 快速开始建议

让我们先用Docker快速启动，然后您可以决定是否要切换到其他方案：

1. **启动Docker服务**
2. **导入您的数据**
3. **测试Web应用连接**
4. **如果满意，继续开发**
5. **如果需要，再迁移到Aura或Desktop**

您想选择哪种方案？我可以为您提供详细的安装和配置指导！
