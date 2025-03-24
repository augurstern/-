const express = require('express');
const router = express.Router();
const db = require('../src/db');
const ExcelJS = require('exceljs');
const path = require('path');

// 确保上传目录存在
const fs = require('fs');
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 支付计划状态枚举
const PaymentStatus = {
  PENDING: 'pending',   // 待付款
  PAID: 'paid',         // 已付款
  OVERDUE: 'overdue',   // 已逾期
  CANCELLED: 'cancelled' // 已取消
};

// 更新支付计划状态
const updatePaymentPlanStatus = (plan) => {
  const now = new Date();
  const plannedDate = new Date(plan.planned_date);
  
  if (plan.actual_payment_date) {
    return PaymentStatus.PAID;
  } else if (plannedDate < now) {
    return PaymentStatus.OVERDUE;
  } else {
    return PaymentStatus.PENDING;
  }
};

// 获取合同的支付计划列表
router.get('/contracts/:contractId/payment-plans', async (req, res, next) => {
  try {
    const { contractId } = req.params;
    
    // 验证合同ID
    if (!contractId) {
      return res.status(400).json({ error: '合同ID不能为空' });
    }
    
    // 查询支付计划
    const stmt = db.prepare('SELECT * FROM payment_plans WHERE contract_id = ? ORDER BY planned_date ASC');
    const paymentPlans = stmt.all(contractId);
    
    // 更新每个支付计划的状态
    paymentPlans.forEach(plan => {
      plan.status = updatePaymentPlanStatus(plan);
    });
    
    res.json(paymentPlans);
  } catch (err) {
    console.error('获取支付计划失败:', err);
    next(err);
  }
});

// 创建支付计划
router.post('/contracts/:contractId/payment-plans', async (req, res, next) => {
  try {
    const { contractId } = req.params;
    const { amount, planned_date } = req.body;

    // 验证请求体
    if (!req.body) {
      return res.status(400).json({ error: '请求体不能为空' });
    }
    
    // 验证参数
    if (!contractId) {
      return res.status(400).json({ error: '合同ID不能为空' });
    }
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: '支付金额必须大于0' });
    }
    
    if (!planned_date) {
      return res.status(400).json({ error: '计划支付日期不能为空' });
    }
    
    // 获取合同信息以验证总额
    const contract = db.prepare('SELECT amount FROM contracts WHERE id = ?').get(contractId);
    if (!contract) {
      return res.status(404).json({ error: '合同不存在' });
    }
    
    // 获取已有支付计划总额
    const existingPlansStmt = db.prepare('SELECT SUM(amount) as total FROM payment_plans WHERE contract_id = ?');
    const { total = 0 } = existingPlansStmt.get(contractId);
    
    // 验证新增支付计划后是否超过合同总额
    if (total + amount > contract.amount) {
      return res.status(400).json({ error: '支付计划总额超过合同金额' });
    }
    
    // 创建支付计划
    const stmt = db.prepare(
      'INSERT INTO payment_plans (contract_id, amount, planned_date, created_at, status) VALUES (?, ?, ?, ?, ?)'
    );
    
    const now = new Date().toISOString();
    const status = updatePaymentPlanStatus({ planned_date: planned_date });
    const result = stmt.run(contractId, amount, planned_date, now, status);
    
    // 获取新创建的支付计划
    const newPlan = db.prepare('SELECT * FROM payment_plans WHERE id = ?').get(result.lastInsertRowid);
    
    res.status(201).json(newPlan);
  } catch (err) {
    console.error('创建支付计划失败:', err);
    next(err);
  }
});

// 更新支付计划
router.put('/payment-plans/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, planned_date, actual_payment_date, status } = req.body;

    // 验证请求体
    if (!req.body) {
      return res.status(400).json({ error: '请求体不能为空' });
    }

    // 验证金额格式
    if (amount !== undefined && (isNaN(amount) || amount < 0)) {
      return res.status(400).json({ error: '无效的付款金额' });
    }

    // 验证日期格式
    if (planned_date && !Date.parse(planned_date)) {
      return res.status(400).json({ error: '无效的计划付款日期' });
    }

    if (actual_payment_date && !Date.parse(actual_payment_date)) {
      return res.status(400).json({ error: '无效的实际付款日期' });
    }
    
    // 验证参数
    if (!id) {
      return res.status(400).json({ error: '支付计划ID不能为空' });
    }
    
    // 检查支付计划是否存在
    const existingPlan = db.prepare('SELECT * FROM payment_plans WHERE id = ?').get(id);
    if (!existingPlan) {
      return res.status(404).json({ error: '支付计划不存在' });
    }
    
    // 构建更新字段
    const updates = [];
    const params = [];
    
    if (amount !== undefined && amount > 0) {
      updates.push('amount = ?');
      params.push(amount);
    }
    
    if (planned_date !== undefined) {
      updates.push('planned_date = ?');
      params.push(planned_date);
    }
    
    if (actual_payment_date !== undefined) {
      updates.push('actual_payment_date = ?');
      params.push(actual_payment_date);
    }
    
    // 如果没有更新字段，则返回错误
    if (updates.length === 0) {
      return res.status(400).json({ error: '没有提供有效的更新字段' });
    }
    
    // 更新支付计划
    params.push(id); // 添加ID作为WHERE条件的参数
    const stmt = db.prepare(`UPDATE payment_plans SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...params);
    
    // 获取更新后的支付计划
    const updatedPlan = db.prepare('SELECT * FROM payment_plans WHERE id = ?').get(id);
    
    res.json(updatedPlan);
  } catch (err) {
    console.error('更新支付计划失败:', err);
    next(err);
  }
});

// 删除支付计划
router.delete('/payment-plans/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // 验证参数
    if (!id) {
      return res.status(400).json({ error: '支付计划ID不能为空' });
    }
    
    // 检查支付计划是否存在
    const existingPlan = db.prepare('SELECT * FROM payment_plans WHERE id = ?').get(id);
    if (!existingPlan) {
      return res.status(404).json({ error: '支付计划不存在' });
    }
    
    // 删除支付计划
    const stmt = db.prepare('DELETE FROM payment_plans WHERE id = ?');
    stmt.run(id);
    
    res.status(200).json({ message: '支付计划已删除' });
  } catch (err) {
    console.error('删除支付计划失败:', err);
    next(err);
  }
});

// 导出支付计划
router.get('/contracts/:contractId/payment-plans/export', async (req, res, next) => {
  try {
    const { contractId } = req.params;
    
    // 获取合同信息
    const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(contractId);
    if (!contract) {
      return res.status(404).json({ error: '合同不存在' });
    }
    
    // 获取支付计划列表
    const stmt = db.prepare('SELECT * FROM payment_plans WHERE contract_id = ? ORDER BY planned_date ASC');
    const paymentPlans = stmt.all(contractId);
    
    // 创建工作簿
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('支付计划');
    
    // 设置表头
    worksheet.columns = [
      { header: '序号', key: 'id', width: 10 },
      { header: '付款金额', key: 'amount', width: 15 },
      { header: '计划付款日期', key: 'planned_date', width: 20 },
      { header: '实际付款日期', key: 'actual_payment_date', width: 20 },
      { header: '状态', key: 'status', width: 15 }
    ];
    
    // 添加数据
    paymentPlans.forEach(plan => {
      worksheet.addRow({
        id: plan.id,
        amount: plan.amount,
        planned_date: plan.planned_date,
        actual_payment_date: plan.actual_payment_date || '-',
        status: getStatusText(plan.status)
      });
    });
    
    // 添加合计行
    const totalRow = worksheet.addRow({
      id: '合计',
      amount: paymentPlans.reduce((sum, plan) => sum + plan.amount, 0)
    });
    totalRow.font = { bold: true };
    
    // 生成文件名
    const fileName = `payment_plans_${contractId}_${new Date().getTime()}.xlsx`;
    const filePath = path.join(uploadsDir, fileName);
    
    // 保存文件
    await workbook.xlsx.writeFile(filePath);
    
    // 发送文件
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('文件下载失败:', err);
        next(err);
      }
      // 下载完成后删除临时文件
      fs.unlink(filePath, (err) => {
        if (err) console.error('删除临时文件失败:', err);
      });
    });
  } catch (err) {
    console.error('导出支付计划失败:', err);
    next(err);
  }
});

// 获取状态文本
function getStatusText(status) {
  switch (status) {
    case PaymentStatus.PAID: return '已付款';
    case PaymentStatus.OVERDUE: return '已逾期';
    case PaymentStatus.PENDING: return '待付款';
    case PaymentStatus.CANCELLED: return '已取消';
    default: return '未知';
  }
}

module.exports = router;