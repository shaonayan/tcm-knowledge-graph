# 🔧 添加 Node.js 到 PATH 环境变量

如果 Node.js 已安装但无法在命令行使用，需要将其添加到 PATH。

---

## 🎯 方法一：使用自动脚本（推荐）

### 操作步骤：

1. **运行脚本**
   - 双击 `添加Node.js到PATH.bat`
   - 脚本会自动查找 Node.js 并添加到 PATH

2. **如果找不到 Node.js**
   - 脚本会提示您手动输入路径
   - 找到 Node.js 安装目录（通常包含 `node.exe`）

3. **重新打开命令行**
   - 关闭所有命令提示符和 PowerShell 窗口
   - 重新打开，测试 `node --version`

---

## 🎯 方法二：手动添加（如果脚本失败）

### 步骤1：找到 Node.js 安装路径

1. **打开文件资源管理器**
   - 按 `Win + E`

2. **搜索 node.exe**
   - 在地址栏输入：`C:\Program Files\nodejs`
   - 或：`C:\Program Files (x86)\nodejs`
   - 或：`%LOCALAPPDATA%\Programs\nodejs`
   - 查看是否有 `node.exe` 文件

3. **记录完整路径**
   - 例如：`C:\Program Files\nodejs`
   - 复制这个路径

---

### 步骤2：添加到 PATH

#### 方法A：通过系统设置（推荐）

1. **打开系统属性**
   - 按 `Win + R`
   - 输入：`sysdm.cpl`
   - 按回车

2. **进入环境变量**
   - 点击 "高级" 标签
   - 点击 "环境变量" 按钮

3. **编辑 PATH**
   - 在 "用户变量" 或 "系统变量" 中找到 `Path`
   - 点击 "编辑"
   - 点击 "新建"
   - 输入 Node.js 路径：`C:\Program Files\nodejs`
   - 点击 "确定" 保存

4. **重新打开命令行**
   - 关闭所有命令行窗口
   - 重新打开，测试 `node --version`

---

#### 方法B：通过命令行（需要管理员权限）

1. **以管理员身份运行 PowerShell**
   - 右键点击开始菜单
   - 选择 "Windows PowerShell (管理员)"

2. **执行命令**
   ```powershell
   # 替换为您的实际路径
   $nodePath = "C:\Program Files\nodejs"
   
   # 添加到用户PATH
   [Environment]::SetEnvironmentVariable(
       "Path",
       [Environment]::GetEnvironmentVariable("Path", "User") + ";$nodePath",
       "User"
   )
   ```

3. **重新打开命令行测试**

---

## 🎯 方法三：使用 nvm（如果使用 nvm 安装）

如果您使用 nvm-windows 安装的 Node.js：

1. **检查 nvm 路径**
   - 通常：`C:\Users\您的用户名\AppData\Roaming\nvm`

2. **添加到 PATH**
   - 添加：`C:\Users\您的用户名\AppData\Roaming\nvm`
   - 添加：`C:\Users\您的用户名\AppData\Roaming\npm`

---

## ✅ 验证安装

添加完成后，重新打开命令行，执行：

```bash
node --version
npm --version
```

如果显示版本号，说明成功！

---

## 🆘 如果还是不行

1. **确认 Node.js 已安装**
   - 检查是否有 `node.exe` 文件
   - 尝试直接运行：`"C:\Program Files\nodejs\node.exe" --version`

2. **检查安装**
   - 重新安装 Node.js：https://nodejs.org/
   - 安装时选择 "Add to PATH" 选项

3. **重启电脑**
   - 有时需要重启才能生效

---

## 📝 快速测试

添加 PATH 后，在项目目录运行：

```bash
cd C:\Users\31600\Desktop\tcm-knowledge-graph\frontend
npm run build
```

如果成功，说明配置完成！

