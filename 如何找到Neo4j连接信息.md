# 🔍 如何找到Neo4j连接信息

您需要在Neo4j Aura控制台找到连接URI和密码。

---

## 🎯 方法一：在Neo4j Aura控制台查看（推荐）

### 步骤：

1. **访问Neo4j Aura控制台**
   - 打开：https://console.neo4j.io/
   - 或：https://neo4j.com/cloud/aura/
   - 使用您的Neo4j账号登录

2. **进入您的实例**
   - 登录后，您会看到实例列表
   - 找到您的中医知识图谱实例
   - 点击实例名称进入详情

3. **查看连接信息**
   - 在实例详情页面，您会看到：
     - **Connection URI**: `neo4j+s://xxxxx.databases.neo4j.io`
     - **Username**: `neo4j`
     - **Password**: `[显示或隐藏的密码]`
   
4. **复制连接信息**
   - 点击URI旁边的复制按钮
   - 如果密码被隐藏，点击"Show"显示
   - 复制密码

---

## 🎯 方法二：查看本地配置文件

如果您之前在本地配置过，可以查看：

### 查看backend/.env文件

1. **打开文件**
   - 路径：`tcm-knowledge-graph/backend/.env`
   - 如果文件不存在，查看 `backend/env.example`

2. **查找配置**
   ```env
   NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=您的密码
   ```

---

## 🎯 方法三：查看项目文档

检查项目中是否有记录：

1. **查看文档文件**
   - `NEO4J-AURA-SETUP.md`
   - `NEO4J-密码获取指南.md`
   - 可能记录了连接信息

2. **查看配置文件**
   - `backend/env.example`
   - 可能包含示例格式

---

## 📝 Neo4j URI格式说明

Neo4j Aura的URI格式通常是：

```
neo4j+s://[实例ID].databases.neo4j.io
```

**示例：**
```
neo4j+s://f36358f7.databases.neo4j.io
neo4j+s://a1b2c3d4.databases.neo4j.io
```

**重要：**
- 必须以 `neo4j+s://` 开头（`s`表示安全连接）
- 中间是您的实例ID
- 以 `.databases.neo4j.io` 结尾

---

## 🔑 如果没有Neo4j实例

如果您还没有创建Neo4j Aura实例：

### 快速创建步骤：

1. **访问Neo4j Aura**
   - https://neo4j.com/cloud/aura/

2. **注册/登录**
   - 如果没有账号，点击"Sign Up"注册
   - 免费层可以使用

3. **创建实例**
   - 点击"Create Instance"
   - 选择"Free"免费层
   - 等待2-3分钟创建完成

4. **获取连接信息**
   - 创建完成后会自动显示
   - URI、用户名、密码

---

## ✅ 找到后如何使用

在Railway添加环境变量时：

```
NEO4J_URI = neo4j+s://您的实例ID.databases.neo4j.io
NEO4J_USER = neo4j
NEO4J_PASSWORD = 您复制的密码
```

**示例：**
```
NEO4J_URI = neo4j+s://f36358f7.databases.neo4j.io
NEO4J_USER = neo4j
NEO4J_PASSWORD = abc123xyz456
```

---

## 🆘 如果找不到

### 可能的情况：

1. **还没有创建Neo4j实例**
   - 需要先创建（见上面的步骤）

2. **忘记了账号**
   - 尝试找回密码
   - 或创建新实例

3. **实例已删除**
   - 需要重新创建实例

---

## 🎯 现在操作

1. **访问Neo4j控制台**
   - https://console.neo4j.io/
   - 或 https://neo4j.com/cloud/aura/

2. **登录并找到实例**
   - 查看连接信息

3. **复制URI和密码**
   - 在Railway中使用

告诉我您找到了吗？或者需要我帮您创建新的Neo4j实例？

