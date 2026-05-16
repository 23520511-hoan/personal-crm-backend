const express = require('express');
const router = express.Router();
const { 
  getNotifications, 
  getUnreadCount, 
  markAllAsRead, 
  markAsRead 
} = require('../controllers/notificationController'); // Gọi từ file controller bro vừa tạo lúc nãy
const { protect } = require('../middleware/authMiddleware'); // Dùng middleware bảo mật token xịn

// Tất cả các API thông báo đều phải đi qua gác cổng protect (đăng nhập mới được xài)
router.get('/', protect, getNotifications);                      // [GET] /api/notifications
router.get('/unread-count', protect, getUnreadCount);            // [GET] /api/notifications/unread-count
router.patch('/read-all', protect, markAllAsRead);               // [PATCH] /api/notifications/read-all
router.patch('/:id/read', protect, markAsRead);                  // [PATCH] /api/notifications/:id/read

module.exports = router;