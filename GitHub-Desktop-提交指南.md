# GitHub Desktop 提交指南

## 项目位置
```
C:\Users\31600\Desktop\tcm-knowledge-graph
```

## 远程仓库
```
https://github.com/shaonayan/tcm-knowledge-graph.git
```

## 使用 GitHub Desktop 提交步骤

### 1. 打开 GitHub Desktop
- 如果已安装，直接打开 GitHub Desktop 应用程序
- 如果未安装，请从 https://desktop.github.com/ 下载安装

### 2. 添加本地仓库（如果还没有添加）
- 点击菜单：**File** → **Add Local Repository**
- 或者点击：**File** → **Options** → **Repositories** → **Add**
- 在路径框中输入或浏览选择：
  ```
  C:\Users\31600\Desktop\tcm-knowledge-graph
  ```
- 点击 **Add repository**

### 3. 查看更改
- GitHub Desktop 会自动检测所有未提交的更改
- 左侧面板会显示修改的文件列表
- 可以点击文件查看具体的更改内容

### 4. 准备提交（Stage Changes）
- 在左下角的更改列表中，勾选要提交的文件
- 或者点击 **"Select all"** 选择所有更改
- 注意：`node_modules` 文件夹已被 `.gitignore` 忽略，不会显示

### 5. 编写提交信息
- 在左下角的 **Summary** 框中输入提交说明，例如：
  ```
  优化中医网站UI界面
  ```
- 在 **Description** 框中可以添加更详细的说明（可选）

### 6. 提交更改
- 点击左下角的 **Commit to main** 按钮
- 提交信息会保存到本地仓库

### 7. 推送到 GitHub
- 提交后，点击右上角的 **Push origin** 按钮
- 或者点击菜单：**Repository** → **Push**
- 输入 GitHub 账号密码或使用已保存的凭据
- 等待推送完成

## 主要源代码文件位置

### Frontend 源代码
- `frontend/src/` - React 源代码
- `frontend/src/components/` - 组件文件
- `frontend/src/pages/` - 页面文件
- `frontend/src/styles/` - 样式文件

### 配置文件
- `frontend/package.json` - 依赖配置
- `frontend/vite.config.ts` - Vite 配置
- `frontend/tsconfig.json` - TypeScript 配置

## 注意事项

1. **不要提交的文件**（已在 .gitignore 中配置）：
   - `node_modules/` - 依赖包
   - `dist/` - 构建输出
   - `.env` - 环境变量文件
   - 其他临时文件

2. **提交前检查**：
   - 确保代码可以正常运行
   - 检查是否有敏感信息（如 API 密钥）
   - 确保提交信息清晰明了

3. **分支管理**：
   - 当前分支：`main`
   - 如需创建新分支，点击 **Current branch** → **New branch**

## 常见问题

### Q: 看不到更改？
- 确保文件已保存
- 检查文件是否在 `.gitignore` 中被忽略
- 尝试刷新：**Repository** → **Refresh**

### Q: 推送失败？
- 检查网络连接
- 确认 GitHub 账号权限
- 检查远程仓库地址是否正确

### Q: 需要撤销更改？
- 在文件列表中右键点击文件
- 选择 **Discard changes** 撤销更改

---

**提示**：如果遇到问题，可以查看 GitHub Desktop 的帮助文档或联系技术支持。

