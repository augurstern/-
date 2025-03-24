/**
 * 合同管理系统后端入口文件
 */
const express = require('express');
const cors = require('cors');
const { getDatabase, createContract } = require('./src/db');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// 导入路由
const contractsRouter = require('./routes/contracts');
const notificationsRouter = require('./routes/notifications');
const paymentPlansRouter = require('./routes/payment-plans');

// 导入自定义错误类和中间件
const AppError = require('./src/utils/AppError');
const { authMiddleware } = require('./src/middlewares');

const app = express();
const PORT = process.env.PORT || 3001;

// 配置文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持PDF和DOCX格式文件'), false);
    }
  }
});

// 安全相关中间件
app.use(helmet()); // 设置各种HTTP头以增加安全性
app.use(cors()); // 跨域资源共享

// 请求限制中间件，防止DoS攻击
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每个IP在windowMs内最多100个请求
  standardHeaders: true,
  legacyHeaders: false,
  message: '请求过于频繁，请稍后再试'
});

// 应用中间件
app.use('/api/', apiLimiter); // 对API路由应用速率限制
app.use(express.json({ limit: '10kb' })); // 限制请求体大小
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(compression()); // 压缩响应

// 日志中间件
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // 开发环境使用详细日志
} else {
  app.use(morgan('combined')); // 生产环境使用标准日志格式
}

// 注册API路由
app.use('/api/contracts', contractsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/payment-plans', paymentPlansRouter);

// 全局错误处理中间件
app.use((err, req, res, next) => {
  // 记录错误详情
  console.error('Error:', err.stack);
  
  // 确定HTTP状态码
  const statusCode = err.statusCode || 500;
  
  // 构建错误响应
  const errorResponse = {
    status: 'error',
    message: err.message || '服务器内部错误',
    code: err.code || 'INTERNAL_ERROR',
    // 仅在开发环境下返回堆栈信息
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString()
  };
  
  // 对特定类型的错误提供更友好的消息
  if (statusCode === 400) {
    errorResponse.message = err.message || '请求参数无效';
  } else if (statusCode === 401) {
    errorResponse.message = '未授权访问，请先登录';
  } else if (statusCode === 403) {
    errorResponse.message = '您没有权限执行此操作';
  } else if (statusCode === 404) {
    errorResponse.message = err.message || '请求的资源不存在';
  } else if (statusCode === 409) {
    errorResponse.message = err.message || '资源冲突，请检查数据';
  } else if (statusCode >= 500) {
    // 对于服务器错误，给用户友好提示，但在日志中保留详细信息
    errorResponse.message = '服务器暂时无法处理您的请求，请稍后再试';
  }
  
  res.status(statusCode).json(errorResponse);
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 数据库连接
const { client } = require('./src/db');
const db = client;

// 获取数据库实例（支持测试）
const getDb = (req) => {
  return req.app.locals.testDb || db;
};

/**
 * 基础路由
 */

// 基础路由
app.get('/', (req, res) => {
  res.send('合同管理系统API服务正在运行');
});

// === 认证相关API ===
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  
  // 简单的认证逻辑
  if (username === 'admin' && password === 'admin123') {
    res.json({
      token: 'sample_token_for_admin',
      user: {
        id: '1',
        username: 'admin',
        name: '管理员',
        role: 'admin',
        permissions: ['contract:create', 'contract:edit', 'contract:delete', 'report:view'],
        createTime: new Date().toISOString(),
        lastLoginTime: new Date().toISOString()
      }
    });
  } else if (username === 'user' && password === 'user123') {
    res.json({
      token: 'sample_token_for_user',
      user: {
        id: '2',
        username: 'user',
        name: '普通用户',
        role: 'user',
        permissions: ['contract:view'],
        createTime: new Date().toISOString(),
        lastLoginTime: new Date().toISOString()
      }
    });
  } else {
    res.status(401).json({ error: '用户名或密码错误' });
  }
});

app.post('/api/auth/validate-token', (req, res) => {
  const { token } = req.body;
  // 简单验证
  res.json(token && (token === 'sample_token_for_admin' || token === 'sample_token_for_user'));
});

app.get('/api/auth/current-user', authMiddleware, (req, res) => {
  // 返回当前登录用户信息
  res.json(req.user);
});

// === 合同管理API ===
// 合同相关API已通过路由模块实现，见routes/contracts.js

// 创建新合同API已通过路由模块实现，见routes/contracts.js

// 获取单个合同API已通过路由模块实现，见routes/contracts.js

// 更新合同API已通过路由模块实现，见routes/contracts.js

// 更新合同审批状态API已通过路由模块实现，见routes/contracts.js

// 删除合同API已通过路由模块实现，见routes/contracts.js

// 文件上传API应该移到contracts路由模块中实现

// 统计信息API应该移到专门的统计路由模块中实现

// 启动服务器
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
  });
}

// 导出app对象供测试使用
module.exports = { app };