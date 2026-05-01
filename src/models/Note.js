const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true, index: true },
  
  // Tối ưu: Trim để dọn rác khoảng trắng đầu cuối
  content: { type: String, required: true, trim: true },
  
  // Tối ưu: Index cái này để sau này load Timeline (sort theo ngày) không bị giật lag
  interactionDate: { type: Date, default: Date.now, index: true },
  
  reminder: {
    enabled: { type: Boolean, default: false },
    remindAt: { type: Date },
    content: { type: String, trim: true },
    repeatYearly: { type: Boolean, default: false },
    isSent: { type: Boolean, default: false } 
  },

  // TỐI ƯU MỚI: Tính năng Xóa Mềm cho Note
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date }

}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);