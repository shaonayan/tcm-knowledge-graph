# 快速安装 3D 可视化依赖

## 🚀 最简单方法：双击运行

我已经为您创建了两个安装脚本，**直接双击运行**即可：

### 方法1：双击 `安装3D依赖.bat` ⭐推荐⭐
- **位置**：项目根目录下的 `安装3D依赖.bat`
- **操作**：双击文件即可自动安装
- **适合**：所有 Windows 用户

### 方法2：右键运行 PowerShell 脚本
- **位置**：项目根目录下的 `安装3D依赖.ps1`
- **操作**：右键点击 → "使用 PowerShell 运行"
- **如果提示无法运行**：
  1. 右键点击文件
  2. 选择"属性"
  3. 点击"解除锁定"
  4. 或者以管理员身份运行 PowerShell，然后执行：
     ```powershell
     Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
     ```

## 📋 手动安装（如果脚本不工作）

如果双击脚本无法运行，可以手动执行：

### 步骤1：打开终端
- 按 `Win + R`，输入 `cmd`，按回车
- 或按 `Win + X`，选择"命令提示符"

### 步骤2：进入项目目录
```cmd
cd C:\Users\31600\Desktop\tcm-knowledge-graph\frontend
```

### 步骤3：安装依赖
```cmd
npm install three @react-three/fiber @react-three/drei
```

## ✅ 验证安装

安装完成后，检查：
1. 打开 `frontend/node_modules` 文件夹
2. 应该能看到 `three`、`@react-three` 等文件夹

## 🎯 安装完成后

1. **重启前端服务器**：
   ```cmd
   cd frontend
   npm run dev
   ```

2. **访问高级可视化页面**：
   - 打开浏览器
   - 访问：http://localhost:3000/visualizations
   - 或点击侧边栏的"高级可视化"菜单

## ❓ 常见问题

### Q: 双击脚本没有反应？
A: 
- 确保 Node.js 已安装（访问 https://nodejs.org/ 下载）
- 尝试右键 → "以管理员身份运行"

### Q: 提示 "npm 不是内部或外部命令"？
A: 
- 需要先安装 Node.js
- 安装后需要重启终端或重新打开命令提示符

### Q: 安装速度很慢？
A: 
- 这是正常的，需要下载很多文件
- 如果很慢，可以尝试使用国内镜像（修改 npm 配置）

## 📞 需要帮助？

如果遇到任何问题，请提供：
1. 错误截图或错误信息
2. 使用的安装方法（双击脚本 / 手动安装）
3. Node.js 版本（运行 `node -v` 查看）
