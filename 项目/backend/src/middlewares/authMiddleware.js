/**
 * 认证中间件
 * 用于验证用户身份和权限
 */
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');

/**
 * JWT认证中间件
 * 验证请求头中的Authorization令牌
 */
const authenticate = (req, res, next) => {
  // 获取认证头
  const authHeader = req.headers.authorization;
  
  // 检查认证头是否存在且格式正确
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('未提供认证令牌', 401, 'AUTH_TOKEN_MISSING'));
  }
  
  // 提取令牌
  const token = authHeader.split(' ')[1];
  
  try {
    // 验证令牌
    // 注意：在实际生产环境中，应该使用环境变量存储密钥
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // 将解码后的用户信息添加到请求对象
    req.user = decoded;
    
    next();
  } catch (err) {
    // 处理不同类型的JWT错误
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('认证令牌已过期', 401, 'TOKEN_EXPIRED'));
    } else if (err.name === 'JsonWebTokenError') {
      return next(new AppError('无效的认证令牌', 401, 'TOKEN_INVALID'));
    }
    
    return next(new AppError('认证失败', 401, 'AUTH_FAILED'));
  }
};

/**
 * 授权中间件
 * 检查用户是否具有特定角色
 * @param {string[]} roles - 允许访问的角色数组
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    // 确保先经过认证中间件
    if (!req.user) {
      return next(new AppError('未授权访问', 401, 'UNAUTHORIZED'));
    }
    
    // 如果未指定角色，允许所有已认证用户访问
    if (roles.length === 0) {
      return next();
    }
    
    // 检查用户角色是否在允许的角色列表中
    if (!roles.includes(req.user.role)) {
      return next(new AppError('您没有权限执行此操作', 403, 'FORBIDDEN'));
    }
    
    next();
  };
};

module.exports = {
  authenticate,
  authorize
};