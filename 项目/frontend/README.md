# 合同管理系统

一个现代化的合同管理系统，用于企业合同全生命周期管理。

## 功能特点

- 合同创建、审批、执行和存档的全流程管理
- 基于模板的合同生成系统
- 实时统计分析和数据可视化
- 合同到期提醒和预警
- 用户权限管理和审批流程
- 支持黑暗模式和多种主题切换
- 移动端自适应设计

## 技术栈

### 前端
- Vue 3 (组合式API)
- TypeScript
- Vite
- Pinia
- Vue Router
- Element Plus
- ECharts
- Axios

### 后端
- Node.js
- Express
- PostgreSQL
- JWT认证
- Multer (文件上传)

## 安装与运行

### 使用Docker Compose (推荐)

1. 克隆仓库
```
git clone https://github.com/yourusername/contract-management-system.git
cd contract-management-system
```

2. 启动应用
```
docker-compose up -d
```

3. 访问应用
在浏览器中打开 `http://localhost`

### 本地开发环境

#### 前端

1. 安装依赖
```
cd frontend
npm install
```

2. 启动开发服务器
```
npm run dev
```

#### 后端

1. 安装依赖
```
cd backend
npm install
```

2. 启动开发服务器
```
npm run dev
```

## 测试

### 前端测试
```
cd frontend
npm run test
```

### 端对端测试
```
cd frontend
npm run cypress:open
```

## 部署

系统支持多种部署方式：

1. Docker Compose方式 (推荐)
2. 独立部署前后端
3. 使用CI/CD管道部署

详细部署文档请参见 `docs/deployment.md`

## 项目结构

```
contract-management-system/
├── frontend/              # 前端项目
│   ├── public/            # 静态资源
│   ├── src/               # 源代码
│   │   ├── api/           # API接口
│   │   ├── assets/        # 静态资源
│   │   ├── components/    # 组件
│   │   ├── layouts/       # 布局
│   │   ├── router/        # 路由
│   │   ├── stores/        # 状态管理
│   │   ├── utils/         # 工具函数
│   │   ├── views/         # 页面视图
│   │   ├── App.vue        # 根组件
│   │   └── main.ts        # 入口文件
│   ├── tests/             # 测试
│   ├── Dockerfile         # Docker构建文件
│   └── package.json       # 依赖管理
├── backend/               # 后端项目
│   ├── src/               # 源代码
│   ├── uploads/           # 上传文件目录
│   ├── Dockerfile         # Docker构建文件
│   └── package.json       # 依赖管理
├── docker-compose.yml     # Docker Compose配置
└── README.md              # 项目说明
```

## 开发者团队

- 后端开发: [开发者名字]
- 前端开发: [开发者名字]
- UI/UX设计: [开发者名字]

## 许可证

[MIT License](LICENSE)
