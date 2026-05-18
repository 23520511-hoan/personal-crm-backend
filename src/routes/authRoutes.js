const express = require('express');
const router = express.Router();
const { 
  register, 
  verifyOtp, 
  setupName, 
  login, 
  googleLogin,
  resendOtp,
  forgotPassword,
  resetPassword,
  changePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Bước 1: Đăng ký - chỉ cần email/SĐT + mật khẩu, gửi OTP
router.post('/register', register);

// Gửi lại OTP (Dùng cho user chưa verify mail hoặc lúc lấy lại pass đều được)
router.post('/resend-otp', resendOtp);

// Bước 2: Xác thực OTP → trả về token
router.post('/verify-otp', verifyOtp);

// Bước 3: Nhập tên (yêu cầu token từ bước 2)
router.post('/setup-name', protect, setupName);

// Đăng nhập thông thường
router.post('/login', login);

// Đăng nhập / đăng ký bằng Google
router.post('/google', googleLogin);

// Quên mật khẩu (Nhập email/phone -> Gửi mã OTP)
router.post('/forgot-password', forgotPassword);

// Đặt lại mật khẩu (Nhập mã OTP + Pass mới)
router.post('/reset-password', resetPassword);

// Đổi mật khẩu (Chỉ dùng được khi user đang đăng nhập trong app)
router.put('/change-password', protect, changePassword);

module.exports = router;