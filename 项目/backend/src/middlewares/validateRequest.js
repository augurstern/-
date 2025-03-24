/**
 * 请求数据验证中间件
 * 使用Joi库验证请求数据
 */
const Joi = require('joi');
const AppError = require('../utils/AppError');

/**
 * 创建验证中间件
 * @param {Object} schema - Joi验证模式对象，包含body、query、params等
 * @returns {Function} Express中间件函数
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    // 如果没有提供验证模式，直接通过
    if (!schema) return next();

    // 需要验证的请求部分
    const validationTargets = {
      body: req.body,
      query: req.query,
      params: req.params
    };

    // 验证错误集合
    const validationErrors = [];

    // 对每个目标进行验证
    Object.keys(schema).forEach(key => {
      if (schema[key]) {
        const { error } = schema[key].validate(validationTargets[key], {
          abortEarly: false, // 不在第一个错误时停止
          allowUnknown: true, // 允许未知字段
          stripUnknown: false // 不删除未知字段
        });

        // 收集验证错误
        if (error) {
          error.details.forEach(err => {
            validationErrors.push({
              path: `${key}.${err.path.join('.')}`,
              message: err.message
            });
          });
        }
      }
    });

    // 如果有验证错误，返回400错误
    if (validationErrors.length > 0) {
      return next(new AppError(
        '请求数据验证失败', 
        400, 
        'VALIDATION_ERROR'
      ));
    }

    next();
  };
};

module.exports = validateRequest;