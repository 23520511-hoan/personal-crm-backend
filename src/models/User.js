const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true }, // sparse cho phép null nhưng nếu có phải unique
  phone: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  settings: {
    enableReminderName: { type: Boolean, default: true } // Bật/tắt nhắc nhở kèm tên
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);