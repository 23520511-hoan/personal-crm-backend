const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  let token;

  // Kiểm tra header Authorization có chứa Bearer token không
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Lấy token (bỏ chữ "Bearer " ở đầu)
      token = req.headers.authorization.split(' ')[1];

      // Giải mã token bằng Secret Key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Tìm user và gắn vào request, loại bỏ field password cho an toàn
      req.user = await User.findById(decoded.id).select('-password');
      
      next(); // Cho phép đi tiếp vào Controller
    } catch (error) {
      res.status(401).json({ message: 'Không có quyền truy cập, token không hợp lệ hoặc đã hết hạn' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Không có quyền truy cập, không tìm thấy token' });
  }
};