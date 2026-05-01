const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['REMINDER', 'SPECIAL_DAY', 'SYSTEM'], required: true },
  
  // Dùng để tạo link bấm vào nhảy sang trang Chi tiết Contact / Note
  relatedId: { type: mongoose.Schema.Types.ObjectId }, 
  onModel: { type: String, enum: ['Contact', 'Note'] },
  
  // Bổ sung: Định vị chính xác sự kiện trong mảng specialDays
  specialDayId: { type: mongoose.Schema.Types.ObjectId },
  
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);