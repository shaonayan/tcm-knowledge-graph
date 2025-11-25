# Neo4j Aura 快速配置指南

## 🚀 第一步：创建Neo4j Aura实例

### 1. 访问Neo4j Aura
**网址**: https://neo4j.com/cloud/aura/

### 2. 登录或注册
- 如果您已有账户，直接登录
- 如果没有，点击"Sign Up"注册新账户

### 3. 创建免费实例
点击 **"Create Instance"** 或 **"New Instance"**

**配置信息**：
- **Instance Name**: `TCM-Knowledge-Graph`
- **Cloud Provider**: 选择 `Google Cloud` 或 `AWS`
- **Region**: 选择离您最近的区域（如 `Asia Pacific`）
- **Instance Size**: 选择 **Free** (免费层)
- **Database Name**: 保持默认 `neo4j`

### 4. 等待实例创建
- 创建过程大约需要2-3分钟
- 状态会显示为 "Running" 时即可使用

### 5. 获取连接信息
创建完成后，您会看到：

```
Connection URI: neo4j+s://xxxxxxxx.databases.neo4j.io
Username: neo4j
Password: [自动生成的密码，请复制保存]
```

**重要**: 请复制并保存这些连接信息！

## 🔧 第二步：配置Web应用连接

### 1. 编辑环境配置文件
打开 `backend/.env` 文件，更新以下配置：

```env
# Neo4j Aura配置
NEO4J_URI=neo4j+s://您的实例URI
NEO4J_USER=neo4j
NEO4J_PASSWORD=您的密码
NEO4J_DATABASE=neo4j

# 其他配置保持不变
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

### 2. 测试连接
我们将创建一个简单的连接测试脚本。

## 📊 第三步：导入您的中医知识图谱数据

### 方案A：使用Neo4j Browser（推荐）
1. **打开Neo4j Browser**
   - 在Aura控制台点击 "Open with Neo4j Browser"
   - 或访问：https://browser.neo4j.io/

2. **连接到您的数据库**
   - URI: 您的连接URI
   - Username: neo4j
   - Password: 您的密码

3. **清空数据库**（如果需要）
   ```cypher
   MATCH (n) DETACH DELETE n
   ```

4. **导入CSV数据**
   由于Aura不能直接访问本地文件，我们需要：
   - 将CSV上传到可访问的URL
   - 或使用我们的Web应用导入功能

### 方案B：使用Web应用导入（我们将开发）
我们可以在Web应用中添加数据导入功能。

## 🎯 第四步：验证安装

### 1. 基本查询测试
在Neo4j Browser中运行：

```cypher
// 创建测试节点
CREATE (test:Test {name: "连接测试", timestamp: datetime()})
RETURN test
```

### 2. 删除测试节点
```cypher
MATCH (test:Test) DELETE test
```

## 🔄 第五步：准备数据导入

### 选项1：手动上传CSV
1. 将您的 `中医病证分类与代码_精细清理版.csv` 文件上传到云存储
2. 使用公开URL导入

### 选项2：使用我们的导入工具
我们可以开发一个数据导入页面，让您直接上传CSV文件。

### 选项3：分批手动创建
如果数据量不大，可以分批手动执行Cypher语句。

## 📝 配置检查清单

完成以下步骤后，请告诉我：

- [ ] Neo4j Aura实例已创建并运行
- [ ] 获得了连接URI和密码
- [ ] 已更新 `backend/.env` 文件
- [ ] 能够在Neo4j Browser中连接数据库
- [ ] 准备好导入数据

## 🆘 常见问题

### Q: 忘记了密码怎么办？
A: 在Aura控制台中，点击实例的"Reset Password"

### Q: 连接失败怎么办？
A: 检查URI格式，确保包含 `neo4j+s://` 前缀

### Q: 免费层有什么限制？
A: 
- 存储：200MB
- 内存：1GB
- 足够开发和小规模应用使用

## 🎊 下一步

配置完成后，我们将：

1. **测试Web应用连接**
2. **导入您的中医知识图谱数据**
3. **启动前后端服务**
4. **开始开发可视化功能**

请按照上述步骤创建Neo4j Aura实例，然后告诉我您的连接信息（URI和密码），我将帮您完成配置！
