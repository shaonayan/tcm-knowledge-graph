# 少纳言中医知识图谱 - 快速部署指南

## 🚀 快速开始（Windows）

### 方式一：使用一键部署脚本（推荐）

1. **双击运行 `一键部署.bat`**
   - 脚本会自动：
     - 检查Node.js环境
     - 安装前端依赖
     - 构建前端应用
     - 创建后端配置文件

2. **配置Neo4j连接**
   - 编辑 `backend\.env` 文件
   - 填入您的Neo4j连接信息：
     ```env
     NEO4J_URI=neo4j+s://f36358f7.databases.neo4j.io
     NEO4J_USER=neo4j
     NEO4J_PASSWORD=您的密码
     ```

3. **启动服务器**
   - 双击运行 `启动生产服务器.bat`
   - 或手动运行：
     ```bash
     cd backend
     node server-simple.js
     ```

4. **访问应用**
   - 打开浏览器访问：http://localhost:3001

### 方式二：手动部署

#### 1. 构建前端

```bash
cd frontend
npm install
npm run build
```

#### 2. 配置后端

创建 `backend/.env` 文件：

```env
NODE_ENV=production
PORT=3001
NEO4J_URI=neo4j+s://f36358f7.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=您的Neo4j密码
FRONTEND_URL=http://localhost:3001
```

#### 3. 启动服务器

```bash
cd backend
node server-simple.js
```

## 🌐 部署到云服务器

### 使用PM2（推荐）

1. **安装PM2**
   ```bash
   npm install -g pm2
   ```

2. **启动服务**
   ```bash
   cd backend
   pm2 start server-simple.js --name tcm-kg
   pm2 save
   pm2 startup  # 设置开机自启
   ```

3. **查看状态**
   ```bash
   pm2 status
   pm2 logs tcm-kg
   ```

### 使用Nginx反向代理

1. **安装Nginx**
   ```bash
   # Ubuntu
   sudo apt-get install nginx
   
   # CentOS
   sudo yum install nginx
   ```

2. **配置Nginx**
   
   创建 `/etc/nginx/sites-available/tcm-kg`：
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       # 前端静态文件
       location / {
           root /opt/tcm-knowledge-graph/frontend/dist;
           try_files $uri $uri/ /index.html;
       }
       
       # API代理
       location /api {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **启用配置**
   ```bash
   sudo ln -s /etc/nginx/sites-available/tcm-kg /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. **配置HTTPS（可选）**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## 📱 移动端访问

项目支持响应式设计，可以在移动浏览器中直接访问。

### PWA支持（未来功能）

项目可以配置为PWA，支持：
- 添加到主屏幕
- 离线访问
- 推送通知

## 🔧 环境变量说明

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| NODE_ENV | 运行环境 | development | 否 |
| PORT | 后端端口 | 3001 | 否 |
| NEO4J_URI | Neo4j连接URI | - | 是 |
| NEO4J_USER | Neo4j用户名 | neo4j | 是 |
| NEO4J_PASSWORD | Neo4j密码 | - | 是 |
| FRONTEND_URL | 前端URL（CORS） | http://localhost:3000 | 否 |

## 📊 性能优化建议

1. **启用Gzip压缩**
   - 已在后端配置

2. **使用CDN**
   - 静态资源可以部署到CDN

3. **数据库连接池**
   - Neo4j驱动已自动管理连接池

4. **缓存策略**
   - 可以添加Redis缓存（未来功能）

## 🔒 安全建议

1. **使用HTTPS**
   - 生产环境必须使用HTTPS

2. **环境变量保护**
   - 不要将`.env`文件提交到Git
   - 使用密钥管理服务

3. **防火墙配置**
   - 只开放必要端口

4. **API限流**
   - 可以添加rate limiting（未来功能）

## 🆘 常见问题

### 1. 前端无法访问后端

**解决：**
- 检查CORS配置
- 确认后端服务正在运行
- 检查端口是否被占用

### 2. Neo4j连接失败

**解决：**
- 检查`.env`文件中的配置
- 确认Neo4j服务可访问
- 检查网络连接

### 3. 静态资源404

**解决：**
- 确认前端已构建（`frontend/dist`目录存在）
- 检查文件路径
- 确认Nginx配置正确

## 📞 技术支持

详细文档请查看：
- `部署指南.md` - 完整部署文档
- `快速开始.md` - 快速开始指南
- `项目进度记录.md` - 项目状态

