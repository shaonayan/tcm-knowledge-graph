# 🔍 在Neo4j控制台找到连接信息

您现在在Neo4j Aura控制台的Instances页面，看到了您的实例"TCM-Knowledge-Graph"。

---

## 🎯 方法一：点击实例卡片（推荐）

### 步骤：

1. **点击实例卡片**
   - 在您看到的"TCM-Knowledge-Graph"卡片上
   - **点击整个卡片**或实例名称
   - 进入实例详情页面

2. **查看连接信息**
   - 在实例详情页面
   - 您会看到"Connection Details"或"Connect"部分
   - 显示：
     - **Connection URI**: `neo4j+s://f36358f7.databases.neo4j.io`
     - **Username**: `neo4j`
     - **Password**: `[显示或隐藏]`

3. **复制信息**
   - 点击URI旁边的复制按钮
   - 如果密码被隐藏，点击"Show"或"Reveal"显示
   - 复制密码

---

## 🎯 方法二：使用Connect按钮

### 步骤：

1. **点击"Connect"按钮**
   - 在实例卡片的右侧
   - 点击"Connect"下拉按钮

2. **选择连接方式**
   - 从下拉菜单中选择：
     - "Query" - 会显示连接信息
     - "Developer hub" - 也会显示连接信息
     - 或直接查看连接详情

3. **查看连接信息**
   - 会显示URI、用户名、密码

---

## 🎯 方法三：在实例详情页

### 步骤：

1. **进入实例详情**
   - 点击"TCM-Knowledge-Graph"卡片

2. **查找连接信息区域**
   - 通常在页面顶部或左侧
   - 标题可能是：
     - "Connection Details"
     - "Connect to your database"
     - "Connection Information"

3. **查看信息**
   - URI格式：`neo4j+s://f36358f7.databases.neo4j.io`
   - 用户名：`neo4j`
   - 密码：需要显示或复制

---

## 📝 根据您的实例ID

从图片中我看到您的实例ID是：**f36358f7**

所以您的URI应该是：
```
neo4j+s://f36358f7.databases.neo4j.io
```

**在Railway中配置：**
```
NEO4J_URI = neo4j+s://f36358f7.databases.neo4j.io
NEO4J_USER = neo4j
NEO4J_PASSWORD = [您需要找到密码]
```

---

## 🔑 如何找到密码

### 方法：

1. **在实例详情页**
   - 点击实例卡片进入详情
   - 查找"Password"或"Authentication"部分
   - 如果被隐藏，点击"Show"或"Reveal"

2. **如果找不到密码**
   - 可以点击"Reset Password"重置
   - 会生成新密码
   - **记得保存新密码！**

3. **查看连接字符串**
   - 有些页面会显示完整的连接字符串
   - 格式：`neo4j+s://neo4j:密码@f36358f7.databases.neo4j.io`
   - 可以从中提取密码

---

## ✅ 快速操作

### 现在立即操作：

1. **点击"TCM-Knowledge-Graph"实例卡片**
   - 进入实例详情页面

2. **查找连接信息**
   - 找到"Connection Details"或类似部分
   - 查看URI和密码

3. **复制信息**
   - URI: `neo4j+s://f36358f7.databases.neo4j.io`
   - 用户名: `neo4j`
   - 密码: [复制显示的密码]

4. **在Railway中使用**
   - 回到Railway的Variables页面
   - 添加环境变量

---

## 🎯 如果找不到密码

### 重置密码：

1. **在实例详情页**
   - 找到"Reset Password"或"Change Password"按钮
   - 点击重置

2. **保存新密码**
   - 新密码会显示一次
   - **立即复制保存！**
   - 之后不会再显示

---

## 📋 完整配置信息

找到后，在Railway添加：

```
NEO4J_URI = neo4j+s://f36358f7.databases.neo4j.io
NEO4J_USER = neo4j
NEO4J_PASSWORD = [您找到的密码]
```

---

现在点击"TCM-Knowledge-Graph"实例卡片，告诉我您看到了什么！

