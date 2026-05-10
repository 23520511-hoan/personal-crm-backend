const mongoose = require('mongoose');

const specialDaySchema = new mongoose.Schema({
  occasion: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  note: { type: String, trim: true },
  repeatYearly: { type: Boolean, default: false },
  
  reminder: {
    enabled: { type: Boolean, default: false },
    remindBeforeDays: { type: Number, default: 0 },
    remindTime: { type: String, trim: true }, 
    timezone: { type: String, default: 'Asia/Ho_Chi_Minh', trim: true }, 
    nextReminderAt: { type: Date }, 
    isSent: { type: Boolean, default: false }
  }
});

const contactSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, index: true },
  phone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  dob: { type: Date },
  address: { type: String },
  avatarUrl: { type: String },
  socialLinks: [{ type: String }],
  statusId: { type: mongoose.Schema.Types.ObjectId, ref: 'Status' },
  source: { type: String, trim: true, default: 'Chưa phân loại' }, // Nguồn quen biết trong UI
  
  importedFrom: { type: String, enum: ['manual', 'google'], default: 'manual' },
  externalId: { type: String }, 
  lastSyncedAt: { type: Date },
  
  specialDays: [specialDaySchema],

  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Contact', contactSchema);