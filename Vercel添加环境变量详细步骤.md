# 📝 在Vercel添加环境变量详细步骤

您已经在Vercel的环境变量设置页面，现在需要添加 `VITE_API_URL`。

---

## 🎯 添加环境变量的步骤

### 步骤1：填写Key（变量名）

1. **在"Key"输入框**
   - 找到页面上的 "Key" 输入框（左侧）
   - 输入：`VITE_API_URL`
   - 注意：全部大写，用下划线连接

---

### 步骤2：填写Value（变量值）

1. **在"Value"输入框**
   - 找到 "Value" 输入框（右侧）
   - 输入：`https://tcm-knowledge-graph.onrender.com/api`
   - **重要：** URL后面必须有 `/api`

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

## 📋 完整操作

### 现在立即操作：

1. ✅ **在Key输入框输入：** `VITE_API_URL`

2. ✅ **在Value输入框输入：** `https://tcm-knowledge-graph.onrender.com/api`
   - **注意：** 必须是完整的URL，包括 `https://` 和 `/api`

3. ✅ **确保选择：** "All Environments"

4. ✅ **点击：** "Save" 按钮（黑色按钮，在右侧）

5. ✅ **等待重新部署**
   - Vercel会自动检测到环境变量更改
   - 会自动触发新的部署
   - 等待约2-3分钟

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
2. **在Value输入框输入：** `https://tcm-knowledge-graph.onrender.com/api`
3. **确保选择：** "All Environments"
4. **点击：** "Save" 按钮

保存后告诉我，我会帮您测试网站！🚀

