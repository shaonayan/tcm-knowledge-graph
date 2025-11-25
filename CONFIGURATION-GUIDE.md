# Neo4j Aura 连接配置指南

## 🔧 配置步骤

### 第一步：获取您的Neo4j Aura连接信息

请从您的Neo4j Aura控制台获取以下信息：

```
Connection URI: neo4j+s://xxxxxxxx.databases.neo4j.io
Username: neo4j
Password: [您的密码]
```

### 第二步：配置环境变量

请编辑 `backend/.env` 文件，更新以下配置：

```env
# Neo4j Aura配置
NEO4J_URI=neo4j+s://您的实例URI
NEO4J_USER=neo4j
NEO4J_PASSWORD=您的密码
NEO4J_DATABASE=neo4j
```

### 第三步：测试连接

配置完成后，在backend目录运行：

```bash
cd backend
node test-neo4j-connection.js
```

如果看到 "✅ Neo4j连接成功！" 说明配置正确。

### 第四步：导入数据

连接测试成功后，运行数据导入：

```bash
node import-tcm-data.js
```

这将导入您的中医知识图谱数据。

### 第五步：启动应用

数据导入完成后，启动Web应用：

```bash
# 启动后端
npm run dev

# 在新窗口启动前端
cd ../frontend
npm run dev
```

## 🎯 完整的.env文件模板

```env
# 应用配置
NODE_ENV=development
PORT=3001
API_PREFIX=/api

# Neo4j Aura配置 - 请填入您的连接信息
NEO4J_URI=neo4j+s://您的实例URI
NEO4J_USER=neo4j
NEO4J_PASSWORD=您的密码
NEO4J_DATABASE=neo4j

# CORS配置
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# JWT配置
JWT_SECRET=tcm_knowledge_graph_super_secret_key_2024
JWT_EXPIRES_IN=7d

# 日志配置
LOG_LEVEL=info
LOG_FILE=logs/app.log

# 限流配置
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🆘 故障排除

### 连接失败常见原因：

1. **URI格式错误**
   - 确保包含 `neo4j+s://` 前缀
   - 检查URI是否完整

2. **密码错误**
   - 确保密码正确复制
   - 如果忘记密码，在Aura控制台重置

3. **网络问题**
   - 检查防火墙设置
   - 确保网络连接正常

### 数据导入失败常见原因：

1. **CSV文件路径错误**
   - 确保CSV文件在正确位置
   - 检查文件名是否正确

2. **权限问题**
   - 确保有读取CSV文件的权限
   - 确保有写入数据库的权限

## 📞 需要帮助？

如果遇到任何问题，请提供：
1. 错误信息截图
2. 您的配置信息（隐藏密码）
3. 具体的错误步骤

我会立即帮您解决！
