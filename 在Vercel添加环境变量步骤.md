# 📝 在Vercel添加环境变量步骤

您现在在Vercel的环境变量设置页面，可以在这里添加 `VITE_API_URL`。

---

## 🎯 添加环境变量的步骤

### 步骤1：填写Key（变量名）

1. **在"Key"输入框**
   - 找到页面上的 "Key" 输入框
   - 输入：`VITE_API_URL`
   - 注意：全部大写，用下划线连接

---

### 步骤2：填写Value（变量值）

1. **在"Value"输入框**
   - 找到 "Value" 输入框
   - 输入您的Railway后端URL，**后面加上 `/api`**
   - 格式：`https://您的Railway后端URL/api`
   
   **示例：**
   - 如果Railway URL是：`https://tcm-knowledge-graph-production-xxx.up.railway.app`
   - 那么Value应该是：`https://tcm-knowledge-graph-production-xxx.up.railway.app/api`

2. **如果还没有Railway后端URL**
   - 先回到Railway获取后端URL
   - 然后再回来填写

---

### 步骤3：选择环境

1. **在"Environments"下拉菜单**
   - 找到 "All Environments" 下拉菜单
   - 确保选择 **"All Environments"**（所有环境）
   - 这样会在Production、Preview、Development都生效

---

### 步骤4：保存

1. **点击"Save"按钮**
   - 在页面右侧，找到黑色的 **"Save"** 按钮
   - 点击保存

2. **确认保存**
   - 保存后，会显示提示："A new Deployment is required for your changes to take effect."
   - 这意味着需要重新部署

---

## 📋 完整操作流程

### 现在立即操作：

1. ✅ **在Key输入框输入：** `VITE_API_URL`

2. ✅ **在Value输入框输入：** `https://您的Railway后端URL/api`
   - **需要先获取Railway后端URL**
   - 如果还没有，先到Railway获取

3. ✅ **确保选择：** "All Environments"

4. ✅ **点击：** "Save" 按钮

5. ✅ **等待重新部署**
   - Vercel会自动触发新的部署
   - 或手动触发Redeploy

---

## ⚠️ 重要提示

### 关于Value格式：

- ✅ **正确：** `https://xxx.up.railway.app/api`
- ❌ **错误：** `https://xxx.up.railway.app`（缺少 `/api`）

**为什么需要 `/api`？**
- 因为您的前端代码中，API请求都是以 `/api` 开头的
- 后端路由也配置为 `/api` 前缀

---

## 🔍 如果还没有Railway后端URL

### 先获取后端URL：

1. **回到Railway**
   - 进入 `tcm-knowledge-graph` 服务
   - Settings → Networking
   - 点击 "Generate Domain"
   - 复制URL

2. **然后回到Vercel**
   - 填写Value时使用：`https://您的Railway后端URL/api`

---

## ✅ 添加完成后

添加完成后，您应该：

1. **看到环境变量列表**
   - 在页面下方会显示已添加的变量
   - 应该看到 `VITE_API_URL`

2. **触发重新部署**
   - Vercel会自动检测到更改
   - 会自动触发新的部署
   - 或手动点击 "Deployments" → "Redeploy"

3. **等待部署完成**
   - 约2-3分钟
   - 部署完成后测试网站

---

## 🎯 现在操作

1. **在Key输入框输入：** `VITE_API_URL`
2. **在Value输入框输入：** `https://您的Railway后端URL/api`
3. **确保选择：** "All Environments"
4. **点击：** "Save"

**如果还没有Railway后端URL，先告诉我，我帮您获取！**

