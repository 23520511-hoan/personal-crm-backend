const Notification = require('../models/Notification'); // Đảm bảo có model này

// [GET] /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const query = { userId: req.user._id };
    if (req.query.isRead !== undefined) query.isRead = req.query.isRead === 'true';
    
    const notifications = await Notification.find(query).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// [GET] /api/notifications/unread-count
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user._id, isRead: false });
    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// [PATCH] /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: 'Đã đánh dấu đọc tất cả' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// [PATCH] /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true },
      { new: true }
    );
    res.json(notif);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};