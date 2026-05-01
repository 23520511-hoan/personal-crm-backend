const mongoose = require('mongoose');

// --- 1. SCHEMA CHO NGÀY ĐẶC BIỆT ---
const specialDaySchema = new mongoose.Schema({
  occasion: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  note: { type: String, trim: true },
  repeatYearly: { type: Boolean, default: false },
  
  // Nâng cấp Reminder khớp 100% với API V1
  reminder: {
    enabled: { type: Boolean, default: false },
    remindBeforeDays: { type: Number, default: 0 },
    
    // Lưu khung giờ và múi giờ thay vì 1 ngày Date cố định
    remindTime: { type: String, trim: true }, // VD: "08:00"
    timezone: { type: String, default: 'Asia/Ho_Chi_Minh', trim: true }, 
    
    // Nơi lưu trữ thời điểm đổ chuông tiếp theo do Backend tự tính
    nextReminderAt: { type: Date }, 
    
    isSent: { type: Boolean, default: false }
  }
});

// --- 2. SCHEMA CHÍNH CHO CONTACT ---
const contactSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, index: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  dob: { type: Date },
  address: { type: String },
  avatarUrl: { type: String },
  socialLinks: [{ type: String }],
  source: { type: String, trim: true },
  statusId: { type: mongoose.Schema.Types.ObjectId, ref: 'Status' },
  
  // Nhóm tính năng Google Import (Chờ sẵn cho V2)
  importedFrom: { type: String, enum: ['manual', 'google'], default: 'manual' },
  externalId: { type: String }, 
  lastSyncedAt: { type: Date },
  
  specialDays: [specialDaySchema],

  // Nhóm tính năng Xóa Mềm (Soft Delete)
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date }

}, { timestamps: true });

module.exports = mongoose.model('Contact', contactSchema);