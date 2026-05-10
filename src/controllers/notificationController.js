const Notification = require('../models/Notification');

// [GET] /api/notifications - Lấy danh sách thông báo
exports.getNotifications = async (req, res) => {
  try {
    const { isRead, type } = req.query;
    let query = { userId: req.user._id };

    // Lọc theo trạng thái đã đọc/chưa đọc nếu có truyền lên
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }
    // Lọc theo loại thông báo (REMINDER, SPECIAL_DAY, SUGGESTION, SYSTEM)
    if (type) {
      query.type = type;
    }

    // Lấy danh sách, mới nhất xếp lên đầu
    const notifications = await Notification.find(query).sort({ createdAt: -1 });
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy thông báo', error: error.message });
  }
};

// [GET] /api/notifications/unread-count - Đếm số lượng thông báo chưa đọc
exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await Notification.countDocuments({ 
      userId: req.user._id, 
      isRead: false 
    });
    
    res.json({ unreadCount });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi đếm thông báo', error: error.message });
  }
};

// [PATCH] /api/notifications/read-all - Đánh dấu TẤT CẢ là đã đọc
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    
    res.json({ message: 'Đã đánh dấu tất cả là đã đọc' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// [PATCH] /api/notifications/:id/read - Đánh dấu 1 thông báo là đã đọc
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Không tìm thấy thông báo' });
    }
    
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi cập nhật thông báo', error: error.message });
  }
};