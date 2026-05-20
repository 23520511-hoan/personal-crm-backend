const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true, index: true },
  
  // Thêm tiêu đề (Khớp với UI Ghi chú)
  title: { type: String, trim: true },
  content: { type: String, required: true, trim: true },
  
  interactionDate: { type: Date, default: Date.now, index: true },
  
  reminder: {
    enabled: { type: Boolean, default: false },
    remindAt: { type: Date },
    content: { type: String, default: '' }, // Nội dung nhắc nhở tuỳ chỉnh
    isSent: { type: Boolean, default: false }
  },

  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date }

}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);