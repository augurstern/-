/**
 * 中间件导出模块
 * 集中导出所有中间件，方便在其他文件中引用
 */

const { authenticate, authorize } = require('./authMiddleware');
const validateRequest = require('./validateRequest');

module.exports = {
  authenticate,  // JWT认证中间件
  authorize,     // 角色授权中间件
  validateRequest, // 请求数据验证中间件
  // 为了向后兼容，保留authMiddleware别名
  authMiddleware: authenticate
};