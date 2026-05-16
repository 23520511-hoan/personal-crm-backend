const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true, trim: true, lowercase: true },
  phone: { type: String, unique: true, sparse: true, trim: true },
  password: { type: String },

  // Thông tin cá nhân - name không required khi mới đăng ký, sẽ bổ sung sau khi verify
  name: { type: String, trim: true, default: null },
  avatarUrl: { type: String },
  bio: { type: String, default: '' }, // THÊM DÒNG NÀY VÀO NÈ
  // Trạng thái xác thực
  isVerified: { type: Boolean, default: false },
  otp: { type: String, default: null },
  otpExpiry: { type: Date, default: null },

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
      start: { type: String, default: '22:00' },
      end: { type: String, default: '07:00' }
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);