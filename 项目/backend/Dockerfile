FROM node:16-alpine

# 创建应用目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装应用依赖
RUN npm ci --only=production

# 复制应用代码
COPY . .

# 创建上传目录和备份目录
RUN mkdir -p uploads backups && \
    chmod -R 777 uploads backups

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"] 