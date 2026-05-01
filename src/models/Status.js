const mongoose = require('mongoose');

const statusSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  color: { type: String, default: '#000000' }
}, { timestamps: true });

// Ràng buộc: Một user không được có 2 status trùng tên
statusSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Status', statusSchema);