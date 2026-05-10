const express = require('express');
const router = express.Router();
// Bổ sung googleLogin vào phần require
const { register, login, googleLogin } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
// Thêm dòng route này
router.post('/google', googleLogin);

module.exports = router;