const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  content: { type: String, required: true },
  // Thêm SUGGESTION vào enum
  type: { type: String, enum: ['REMINDER', 'SPECIAL_DAY', 'SUGGESTION', 'SYSTEM'], required: true },
  
  relatedId: { type: mongoose.Schema.Types.ObjectId }, 
  onModel: { type: String, enum: ['Contact', 'Note'] },
  specialDayId: { type: mongoose.Schema.Types.ObjectId },
  
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);