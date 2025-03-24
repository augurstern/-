/**
 * 自定义应用错误类
 * 用于创建具有特定状态码和错误代码的错误对象
 */
class AppError extends Error {
  /**
   * 创建一个应用错误实例
   * @param {string} message - 错误消息
   * @param {number} statusCode - HTTP状态码
   * @param {string} code - 错误代码
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // 标记为可操作的错误，区分于编程错误

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;