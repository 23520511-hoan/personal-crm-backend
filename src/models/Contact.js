const mongoose = require('mongoose');

const specialDaySchema = new mongoose.Schema({
  occasion: { type: String, required: true },
  date: { type: Date, required: true },
  note: { type: String },
  repeatYearly: { type: Boolean, default: false },
  reminder: { type: Boolean, default: false }
});

const contactSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  dob: { type: Date },
  address: { type: String },
  avatarUrl: { type: String },
  socialLinks: [{ type: String }],
  source: { type: String }, // School, Work, Event...
  statusId: { type: mongoose.Schema.Types.ObjectId, ref: 'Status' },
  
  // Nhúng (Embedding) Special Days
  specialDays: [specialDaySchema]
}, { timestamps: true });

module.exports = mongoose.model('Contact', contactSchema);