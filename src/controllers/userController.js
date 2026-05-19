const User = require('../models/User');
const bcrypt = require('bcryptjs');

// [GET] /api/users/me - Lấy thông tin user cho màn Setting
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy profile', error: error.message });
  }
};

// [PUT] /api/users/profile - Sửa thông tin cá nhân (Nhận Token từ Frontend)
exports.updateProfile = async (req, res) => {
  try {
    console.log("=== DỮ LIỆU FRONTEND CẬP NHẬT PROFILE ===", req.body);
    
    // Đã thêm expoPushToken vào đây để hứng data từ Trung gửi lên
    const { name, phone, bio, avatarUrl, expoPushToken } = req.body; 
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, bio, avatarUrl, expoPushToken }, // Nhét vô Database
      { new: true }
    ).select('-password');
    
    res.json(updatedUser);
  } catch (error) {
    console.error("LỖI CẬP NHẬT PROFILE:", error);
    res.status(500).json({ message: 'Lỗi cập nhật profile', error: error.message });
  }
};

// [PUT] /api/users/change-password - Đổi mật khẩu
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    // Kiểm tra mật khẩu cũ
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' }); 
    }

    // Mã hóa và lưu mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi đổi mật khẩu', error: error.message });
  }
};