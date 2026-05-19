const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, changePassword } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// [Các route hiện tại của ông...]
router.get('/me', protect, getProfile);

// 👉 THÊM DÒNG NÀY ĐỂ KHỚP VỚI CODE CỦA TRUNG:
router.patch('/me', protect, updateProfile); 

// (Đây là dòng cũ của ông, giữ lại cũng được)
router.put('/profile', protect, updateProfile);

router.put('/change-password', protect, changePassword);

module.exports = router;