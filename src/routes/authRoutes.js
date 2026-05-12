const express = require('express');
const router = express.Router();
const { register, verifyOtp, setupName, login, googleLogin } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Bước 1: Đăng ký - chỉ cần email/SĐT + mật khẩu, gửi OTP
router.post('/register', register);

// Bước 2: Xác thực OTP → trả về token
router.post('/verify-otp', verifyOtp);

// Bước 3: Nhập tên (yêu cầu token từ bước 2)
router.post('/setup-name', protect, setupName);

// Đăng nhập thông thường
router.post('/login', login);

// Đăng nhập / đăng ký bằng Google
router.post('/google', googleLogin);

module.exports = router;
