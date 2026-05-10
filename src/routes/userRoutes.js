const express = require('express');
const router = express.Router();
const { updateProfile, changePassword } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Gắn hàm protect vào để bắt buộc phải có Token mới được gọi
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;