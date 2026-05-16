const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, changePassword } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Khớp 100% với userApi.ts của frontend
router.get('/me', protect, getProfile);
router.patch('/me', protect, updateProfile);
router.patch('/change-password', protect, changePassword);

module.exports = router;