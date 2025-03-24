# 合同管理系统部署指南

本文档提供合同管理系统的不同部署方式，包括Docker Compose部署、分离部署前后端以及使用CI/CD自动化部署流程。

## 目录
- [环境要求](#环境要求)
- [Docker Compose部署](#docker-compose部署)
- [分离部署](#分离部署)
  - [前端部署](#前端部署)
  - [后端部署](#后端部署)
  - [数据库部署](#数据库部署)
- [CI/CD部署](#cicd部署)
- [配置说明](#配置说明)
- [常见问题](#常见问题)

## 环境要求

### Docker部署
- Docker 20.10.x 或更高版本
- Docker Compose 2.0.0 或更高版本
- 至少2核CPU，4GB内存
- 建议使用Linux系统(CentOS 7+, Ubuntu 20.04+, Debian 10+)

### 独立部署
- Node.js 16+ LTS版本
- PostgreSQL 14+
- Nginx 1.20+
- 2核CPU，4GB内存

## Docker Compose部署

Docker Compose是最简单的部署方式，它会自动设置前端、后端和数据库服务。

### 步骤

1. 确保您的服务器上已安装 Docker 和 Docker Compose

2. 克隆项目仓库
```bash
git clone https://github.com/yourusername/contract-management-system.git
cd contract-management-system
```

3. 配置环境变量（可选）
```bash
cp .env.example .env
# 编辑.env文件配置数据库密码等敏感信息
```

4. 启动服务
```bash
docker-compose up -d
```

5. 验证部署
访问 http://your-server-ip 应该能看到登录页面

### 更新应用

1. 拉取最新代码
```bash
git pull
```

2. 重新构建并启动容器
```bash
docker-compose down
docker-compose up -d --build
```

### 查看日志
```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志，如后端
docker-compose logs backend

# 持续查看日志
docker-compose logs -f
```

## 分离部署

### 前端部署

1. 构建前端项目
```bash
cd frontend
npm install
npm run build
```

2. 配置Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/frontend/dist;
    index index.html;

    # 处理单页应用路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api/ {
        proxy_pass http://backend_server:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. 重启Nginx
```bash
nginx -t
systemctl restart nginx
```

### 后端部署

1. 安装后端依赖
```bash
cd backend
npm install --production
```

2. 配置环境变量
```bash
cp .env.example .env
# 编辑.env文件
```

3. 启动应用（使用PM2）
```bash
npm install -g pm2
pm2 start npm --name "contract-backend" -- start
pm2 save
```

4. 配置PM2开机自启
```bash
pm2 startup
```

### 数据库部署

1. 安装PostgreSQL
```bash
# Ubuntu/Debian
apt update
apt install postgresql postgresql-contrib

# CentOS/RHEL
yum install postgresql-server
```

2. 配置数据库
```bash
# 初始化数据库（CentOS）
postgresql-setup initdb

# 启动服务
systemctl start postgresql
systemctl enable postgresql
```

3. 创建数据库和用户
```bash
sudo -u postgres psql

CREATE DATABASE contract_management;
CREATE USER app_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE contract_management TO app_user;
\q
```

## CI/CD部署

本项目可以通过CI/CD管道自动化部署，以下提供GitHub Actions的配置示例。

### GitHub Actions配置示例

在项目根目录创建 `.github/workflows/deploy.yml` 文件：

```yaml
name: Deploy Contract Management System

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'
          
      - name: Install frontend dependencies
        run: |
          cd frontend
          npm ci
          
      - name: Build frontend
        run: |
          cd frontend
          npm run build
          
      - name: Deploy to server
        uses: appleboy/scp-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          source: "frontend/dist/*,backend/*,docker-compose.yml"
          target: "/path/on/server/contract-management-system"
          strip_components: 0
          
      - name: Restart services
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /path/on/server/contract-management-system
            docker-compose down
            docker-compose up -d --build
```

## 配置说明

### 重要环境变量

- `NODE_ENV`: 环境类型 (development, production)
- `DB_HOST`: 数据库主机
- `DB_PORT`: 数据库端口
- `DB_USER`: 数据库用户名
- `DB_PASSWORD`: 数据库密码
- `DB_NAME`: 数据库名称
- `JWT_SECRET`: JWT加密密钥
- `JWT_EXPIRES_IN`: JWT过期时间 (例如: "1d")
- `PORT`: 后端服务端口

### 文件存储配置

默认情况下，文件存储在后端的 `/uploads` 目录。如果要修改存储路径，需要更新 `docker-compose.yml` 的卷映射配置或后端的环境变量。

## 常见问题

### 数据库连接问题

**问题**: 后端无法连接到数据库
**解决方案**: 
- 检查数据库凭据和连接字符串
- 确保数据库服务已启动
- 检查防火墙是否允许指定端口的连接

### 文件上传失败

**问题**: 无法上传文件或找不到上传的文件
**解决方案**:
- 确保上传目录存在且有正确的写入权限
- 检查文件大小限制配置
- 在Docker环境中，确保卷映射正确

### 前端API调用失败

**问题**: 前端无法连接到后端API
**解决方案**:
- 检查API基础URL配置
- 确保API代理设置正确
- 检查CORS配置 