const express = require('express');
const router = express.Router();
const { getUserNotifications, markNotificationAsRead } = require('../src/services/systemNotificationService');

// 获取用户的未读通知
router.get('/notifications', async (req, res, next) => {
  try {
    const userId = req.user.id; // 从JWT中获取用户ID
    const notifications = getUserNotifications(userId);
    res.json(notifications);
  } catch (err) {
    console.error('获取通知失败:', err);
    next(err);
  }
});

// 标记通知为已读
router.put('/notifications/:id/read', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // 验证通知是否属于当前用户
    const notification = db.prepare('SELECT * FROM notifications WHERE id = ? AND user_id = ?').get(id, userId);
    if (!notification) {
      return res.status(404).json({ error: '通知不存在' });
    }
    
    markNotificationAsRead(id);
    res.json({ success: true });
  } catch (err) {
    console.error('标记通知已读失败:', err);
    next(err);
  }
});

// 标记所有通知为已读
router.put('/notifications/read-all', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const stmt = db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?');
    stmt.run(userId);
    res.json({ success: true });
  } catch (err) {
    console.error('标记所有通知已读失败:', err);
    next(err);
  }
});

module.exports = router;