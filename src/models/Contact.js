const mongoose = require('mongoose');

const specialDaySchema = new mongoose.Schema({
  occasion: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  note: { type: String, trim: true },
  repeatYearly: { type: Boolean, default: false },
  reminder: {
    enabled: { type: Boolean, default: false },
    remindAt: { type: Date },
    remindBeforeDays: { type: Number, default: 0 },
    isSent: { type: Boolean, default: false }
  }
});

const contactSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  
  // Tối ưu: Đánh index để search tên gộp trùng cực nhanh + trim để chống lỗi dấu cách
  name: { type: String, required: true, trim: true, index: true }, 
  
  phone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true }, // Luôn đưa email về chữ thường
  dob: { type: Date },
  address: { type: String },
  avatarUrl: { type: String },
  socialLinks: [{ type: String }],
  source: { type: String, trim: true },
  statusId: { type: mongoose.Schema.Types.ObjectId, ref: 'Status' },
  
  // Google Import
  importedFrom: { type: String, enum: ['manual', 'google'], default: 'manual' },
  externalId: { type: String }, 
  lastSyncedAt: { type: Date },
  
  specialDays: [specialDaySchema],

  // TỐI ƯU MỚI: Tính năng Xóa Mềm (Soft Delete) - Cứu tinh chống mất dữ liệu
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date }

}, { timestamps: true });

module.exports = mongoose.model('Contact', contactSchema);