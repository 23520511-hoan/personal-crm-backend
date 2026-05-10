const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
  phone: { type: String, unique: true, sparse: true, trim: true },
  password: { type: String }, // Bỏ required: true vì đăng nhập Google sẽ không có password
  
  // Thông tin cá nhân (Khớp với UI Cài đặt)
  name: { type: String, required: true, trim: true },
  avatarUrl: { type: String },
  bio: { type: String, trim: true }, // "Đang xây dựng thói quen quan tâm..."
  
  // Đăng nhập Google
  googleId: { type: String, unique: true, sparse: true },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },

  settings: {
    language: { type: String, enum: ['vi', 'en'], default: 'vi' },
    darkMode: { type: Boolean, default: false },
    notifications: {
      allEnabled: { type: Boolean, default: true },
      reminders: { type: Boolean, default: true },
      specialDays: { type: Boolean, default: true },
      connectionHints: { type: Boolean, default: false }
    },
    quietHours: {
      enabled: { type: Boolean, default: true },
      start: { type: String, default: '22:00' }, // Giờ bắt đầu (HH:mm)
      end: { type: String, default: '07:00' }    // Giờ kết thúc
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);