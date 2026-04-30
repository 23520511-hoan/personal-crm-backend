const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  contactId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contact', required: true, index: true },
  content: { type: String, required: true },
  interactionDate: { type: Date, default: Date.now } // Ngày thực tế của sự kiện/ghi chú
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);