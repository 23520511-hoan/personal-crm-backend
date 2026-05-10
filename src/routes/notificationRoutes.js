const express = require('express');
const router = express.Router();
const { 
  getNotifications, 
  getUnreadCount, 
  markAllAsRead, 
  markAsRead 
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

// Chú ý: Các route tĩnh (như /unread-count, /read-all) phải đặt TRƯỚC route động (/:id/read)
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllAsRead);

router.route('/')
  .get(getNotifications);

router.patch('/:id/read', markAsRead);

module.exports = router;