# 合同管理系统

一个现代化的企业合同管理系统，提供合同全生命周期管理，支持合同创建、审批、执行、变更、终止和存档等功能。

## 项目概览

本项目是一个基于Vue 3和Node.js的完整合同管理解决方案，包含前端和后端代码，可以通过Docker快速部署。系统设计遵循现代化UI/UX原则，提供直观的用户体验。

## 系统功能

### 用户与权限
- 基于角色的权限控制系统
- 支持多级审批流程
- 用户活动日志记录

### 合同管理
- 合同创建和模板选择
- 多级审批工作流
- 合同执行状态跟踪
- 到期提醒和预警机制
- 合同变更与终止管理
- 历史版本记录

### 统计分析
- 合同数量和金额统计
- 按类型、状态、部门的合同分布
- 合同履行进度跟踪
- 可导出报表数据

### 系统设置
- 自定义合同类型和状态
- 审批流程配置
- 系统参数设置
- 数据备份与恢复

## 技术架构

### 前端
- Vue 3 + TypeScript
- Vite 构建工具
- Pinia 状态管理
- Vue Router 路由管理
- Element Plus UI组件库
- ECharts 数据可视化
- Axios HTTP客户端

### 后端
- Node.js + Express
- PostgreSQL 数据库
- JWT 身份认证
- 文件上传与存储服务
- RESTful API设计

## 快速开始

### 使用Docker Compose

1. 确保已安装Docker和Docker Compose
2. 克隆本仓库
3. 在项目根目录执行：
```bash
docker-compose up -d
```
4. 访问 http://localhost 使用系统

### 本地开发

#### 前端
```bash
cd frontend
npm install
npm run dev
```

#### 后端
```bash
cd backend
npm install
npm run dev
```

## 目录结构
```
Contract-management-system/
├── frontend/              # 前端Vue项目
├── backend/               # 后端Node.js项目
└── docker-compose.yml     # Docker配置文件
```

## 开发团队

- 产品经理：[姓名]
- 前端开发：[姓名]
- 后端开发：[姓名]
- UI/UX设计：[姓名]

## 许可证

[MIT](LICENSE) 