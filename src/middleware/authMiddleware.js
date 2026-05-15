const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      next(); 
    } catch (error) {
      // THÊM CHỮ "return" VÀO ĐÂY
      return res.status(401).json({ message: 'Không có quyền truy cập, token không hợp lệ hoặc đã hết hạn' });
    }
  }

  if (!token) {
    // THÊM CHỮ "return" VÀO ĐÂY
    return res.status(401).json({ message: 'Không có quyền truy cập, không tìm thấy token' });
  }
};