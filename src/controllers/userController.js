const User = require('../models/User');
const bcrypt = require('bcryptjs');

// [PUT] /api/users/profile - Sửa thông tin cá nhân
exports.updateProfile = async (req, res) => {
    try {
      const user = await User.findById(req.user._id);
  
      if (user) {
        user.name = req.body.name || user.name;
        if (req.body.bio !== undefined) user.bio = req.body.bio;
        if (req.body.avatarUrl) user.avatarUrl = req.body.avatarUrl;
        
        // Xử lý an toàn tuyệt đối cho object lồng nhau trong Mongoose
        if (req.body.settings) {
          if (req.body.settings.darkMode !== undefined) user.settings.darkMode = req.body.settings.darkMode;
          if (req.body.settings.language !== undefined) user.settings.language = req.body.settings.language;
          
          // Cực kỳ quan trọng: Báo cho Mongoose biết trường settings đã bị thay đổi
          user.markModified('settings');
        }
  
        const updatedUser = await user.save();
        
        res.json({
          _id: updatedUser._id,
          name: updatedUser.name,
          bio: updatedUser.bio,
          avatarUrl: updatedUser.avatarUrl,
          settings: updatedUser.settings
        });
      } else {
        res.status(404).json({ message: 'Không tìm thấy người dùng' });
      }
    } catch (error) {
      res.status(500).json({ message: 'Lỗi server khi cập nhật hồ sơ', error: error.message });
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