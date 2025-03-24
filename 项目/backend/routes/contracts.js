/**
 * 合同管理路由模块
 * 处理合同的创建、查询、更新和删除操作
 */
const express = require('express');
const router = express.Router();
const db = require('../src/db');
const validateRequest = require('../src/middlewares/validateRequest');
const { createContractSchema, updateContractSchema } = require('../src/validations/contractValidation');
const AppError = require('../src/utils/AppError');

/**
 * 获取所有合同列表
 * @route GET /api/contracts
 * @returns {Array} 合同列表
 */
router.get('/', async (req, res, next) => {
  try {
    // 支持分页查询
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    
    // 获取合同总数
    const countStmt = db.prepare('SELECT COUNT(*) as total FROM contracts');
    const { total } = countStmt.get();
    
    // 获取分页数据
    const stmt = db.prepare(`
      SELECT * FROM contracts 
      ORDER BY id DESC
      LIMIT ? OFFSET ?
    `);
    const contracts = stmt.all(pageSize, offset);
    
    // 返回带分页信息的响应
    res.json({
      items: contracts,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (err) {
    next(new AppError(`获取合同列表失败: ${err.message}`, 500));
  }
});

/**
 * 创建新合同
 * @route POST /api/contracts
 * @param {Object} req.body - 合同数据
 * @returns {Object} 新创建的合同
 */
router.post('/', validateRequest(createContractSchema), async (req, res, next) => {
  try {
    const { title, content, parties, amount, sign_date, payment_cycle } = req.body;
    
    // 构建插入语句，使用命名参数提高安全性和可读性
    const stmt = db.prepare(`
      INSERT INTO contracts (
        contract_name, client_name, amount, sign_date, 
        approval_status, payment_cycle
      ) VALUES (?, ?, ?, ?, 'draft', ?)
    `);
    
    // 执行插入操作
    const info = stmt.run(
      title, 
      parties, 
      amount || 0, 
      sign_date || new Date().toISOString().split('T')[0],
      payment_cycle || 1
    );
    
    // 获取新创建的合同
    const newContract = db.prepare('SELECT * FROM contracts WHERE id = ?')
      .get(info.lastInsertRowid);
      
    if (!newContract) {
      throw new AppError('创建合同失败', 500);
    }
    
    res.status(201).json(newContract);
  } catch (err) {
    next(new AppError(`创建合同失败: ${err.message}`, 400));
  }
});

/**
 * 获取单个合同详情
 * @route GET /api/contracts/:id
 * @param {number} req.params.id - 合同ID
 * @returns {Object} 合同详情
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // 验证ID参数
    if (!id || isNaN(parseInt(id))) {
      return next(new AppError('无效的合同ID', 400));
    }
    
    // 查询合同
    const stmt = db.prepare('SELECT * FROM contracts WHERE id = ?');
    const contract = stmt.get(id);
    
    // 检查合同是否存在
    if (!contract) {
      return next(new AppError('合同不存在', 404));
    }
    
    res.json(contract);
  } catch (err) {
    next(new AppError(`获取合同详情失败: ${err.message}`, 500));
  }
});

/**
 * 更新合同信息
 * @route PUT /api/contracts/:id
 * @param {number} req.params.id - 合同ID
 * @param {Object} req.body - 更新的合同数据
 * @returns {Object} 更新后的合同
 */
router.put('/:id', validateRequest(updateContractSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // 检查合同是否存在
    const existingContract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(id);
    if (!existingContract) {
      return next(new AppError('合同不存在', 404));
    }
    
    // 构建更新语句
    const updateFields = [];
    const updateValues = [];
    
    // 动态构建更新字段
    Object.keys(updateData).forEach(key => {
      // 检查字段是否在允许更新的列表中
      const allowedFields = ['contract_name', 'client_name', 'amount', 'sign_date', 
                            'approval_status', 'payment_cycle', 'milestone_status'];
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(updateData[key]);
      }
    });
    
    // 如果没有要更新的字段，直接返回现有合同
    if (updateFields.length === 0) {
      return res.json(existingContract);
    }
    
    // 添加ID到更新值数组
    updateValues.push(id);
    
    // 执行更新
    const stmt = db.prepare(`
      UPDATE contracts 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `);
    stmt.run(...updateValues);
    
    // 获取更新后的合同
    const updatedContract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(id);
    res.json(updatedContract);
  } catch (err) {
    next(new AppError(`更新合同失败: ${err.message}`, 400));
  }
});

/**
 * 删除合同
 * @route DELETE /api/contracts/:id
 * @param {number} req.params.id - 合同ID
 * @returns {Object} 删除结果
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // 验证ID参数
    if (!id || isNaN(parseInt(id))) {
      return next(new AppError('无效的合同ID', 400));
    }
    
    // 检查合同是否存在
    const existingContract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(id);
    if (!existingContract) {
      return next(new AppError('合同不存在', 404));
    }
    
    // 执行删除
    const stmt = db.prepare('DELETE FROM contracts WHERE id = ?');
    stmt.run(id);
    
    res.json({ success: true, message: '合同已成功删除' });
  } catch (err) {
    next(new AppError(`删除合同失败: ${err.message}`, 500));
  }
});

// 导出路由模块
module.exports = router;