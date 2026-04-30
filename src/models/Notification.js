const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['REMINDER', 'SPECIAL_DAY', 'SYSTEM'], required: true },
  relatedId: { type: mongoose.Schema.Types.ObjectId }, // Có thể là ID của Contact hoặc Note
  onModel: { type: String, enum: ['Contact', 'Note'] }, // Cho biết relatedId trỏ vào bảng nào
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);