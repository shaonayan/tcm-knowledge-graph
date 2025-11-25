# 🔧 解决 npm 不在 PATH 中的问题

## 问题说明

在 PowerShell 中无法识别 `npm` 命令，通常是因为 Node.js 安装后没有正确添加到系统 PATH 环境变量中。

## ✅ 解决方案

### 方案一：使用批处理脚本（.bat）- 推荐 ⭐

批处理脚本通常能自动找到 Node.js，即使 PowerShell 找不到。

**操作步骤：**
1. 双击运行 `执行部署.bat`（不是 PowerShell）
2. 批处理脚本会自动找到 Node.js 和 npm

**为什么推荐：**
- 批处理脚本使用 CMD，通常能自动找到 Node.js
- 不需要修改系统设置
- 最简单快捷

---

### 方案二：重启 PowerShell

Node.js 安装后，需要重启终端才能识别。

**操作步骤：**
1. 完全关闭当前的 PowerShell 窗口
2. 重新打开 PowerShell
3. 运行 `node --version` 测试
4. 如果成功，运行 `npm --version` 测试

---

### 方案三：手动添加到 PATH（当前会话）

临时添加到当前 PowerShell 会话的 PATH：

```powershell
# 找到 Node.js 安装路径（通常是以下之一）
$nodePath = "C:\Program Files\nodejs"
# 或
$nodePath = "C:\Program Files (x86)\nodejs"

# 添加到当前会话的 PATH
$env:PATH += ";$nodePath"

# 测试
node --version
npm --version
```

---

### 方案四：永久添加到系统 PATH

**Windows 10/11 操作步骤：**

1. **打开系统属性**
   - 按 `Win + R`
   - 输入 `sysdm.cpl`，回车
   - 或：右键"此电脑" → 属性 → 高级系统设置

2. **编辑环境变量**
   - 点击"环境变量"按钮
   - 在"系统变量"中找到 `Path`
   - 点击"编辑"

3. **添加 Node.js 路径**
   - 点击"新建"
   - 输入 Node.js 安装路径（通常是）：
     ```
     C:\Program Files\nodejs
     ```
   - 或：
     ```
     C:\Program Files (x86)\nodejs
     ```
   - 点击"确定"保存

4. **验证**
   - 关闭所有 PowerShell/CMD 窗口
   - 重新打开 PowerShell
   - 运行 `node --version` 和 `npm --version`

---

### 方案五：使用完整路径

如果知道 Node.js 的安装路径，可以直接使用完整路径：

```powershell
# 假设 Node.js 安装在 C:\Program Files\nodejs
& "C:\Program Files\nodejs\npm.cmd" --version
& "C:\Program Files\nodejs\npm.cmd" run build
```

---

### 方案六：重新安装 Node.js

如果以上方法都不行，可能是 Node.js 安装有问题：

1. **卸载 Node.js**
   - 控制面板 → 程序和功能 → 卸载 Node.js

2. **重新安装**
   - 访问：https://nodejs.org/
   - 下载 LTS 版本
   - 安装时**确保勾选**"Add to PATH"选项

3. **重启电脑**（推荐）
   - 确保环境变量生效

---

## 🔍 查找 Node.js 安装位置

运行以下命令查找 Node.js：

```powershell
# 方法1：检查常见安装位置
$paths = @(
    "C:\Program Files\nodejs",
    "C:\Program Files (x86)\nodejs",
    "$env:APPDATA\npm",
    "$env:LOCALAPPDATA\Programs\nodejs"
)
foreach ($path in $paths) {
    if (Test-Path "$path\node.exe") {
        Write-Host "找到 Node.js: $path"
    }
}

# 方法2：搜索整个系统（较慢）
Get-ChildItem -Path "C:\Program Files" -Filter "node.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
```

---

## ✅ 推荐操作流程

**最简单的方法：**

1. **直接使用批处理脚本**
   - 双击 `执行部署.bat`
   - 批处理脚本会自动找到 Node.js

2. **如果批处理脚本也找不到**
   - 使用方案四：永久添加到系统 PATH
   - 或使用方案六：重新安装 Node.js

---

## 📝 验证安装

安装/配置完成后，验证：

```powershell
# 检查 Node.js
node --version
# 应该显示：v20.x.x 或类似版本

# 检查 npm
npm --version
# 应该显示：10.x.x 或类似版本

# 检查 PATH
$env:PATH -split ';' | Where-Object { $_ -like '*node*' }
# 应该显示包含 nodejs 的路径
```

---

## 🆘 仍然无法解决？

如果以上方法都不行，请提供：
1. Node.js 安装路径
2. 错误信息截图
3. `$env:PATH` 的输出内容

我会帮您进一步诊断。

