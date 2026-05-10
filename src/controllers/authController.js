const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// Thêm 2 dòng này cho Google:
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ... (giữ nguyên hàm generateToken, register, login của bạn)

// Hàm tạo Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// [POST] /api/auth/register - Đăng ký tài khoản mới
exports.register = async (req, res) => {
  try {
    const { email, phone, password, name } = req.body;

    // 1. Kiểm tra xem user đã tồn tại chưa (check cả email hoặc số điện thoại)
    const userExists = await User.findOne({ $or: [{ email }, { phone }] });
    if (userExists) {
      return res.status(400).json({ message: 'Email hoặc Số điện thoại đã được sử dụng' });
    }

    // 2. Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Tạo user mới
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword
    });

    // 4. Trả về data kèm Token
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi đăng ký', error: error.message });
  }
};

// [POST] /api/auth/login - Đăng nhập
exports.login = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    // 1. Tìm user bằng email hoặc số điện thoại
    const user = await User.findOne({ 
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }] 
    });

    // 2. Kiểm tra user và mật khẩu
    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Email/Số điện thoại hoặc mật khẩu không đúng' }); // Khớp với câu báo lỗi màu đỏ trên UI
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi đăng nhập', error: error.message });
  }
};

// [POST] /api/auth/google - Đăng nhập/Đăng ký bằng Google
exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    // 1. Xác minh Token với máy chủ Google
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    // 2. Lấy thông tin user từ Google
    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload; // 'sub' chính là Google ID duy nhất

    // 3. Kiểm tra xem user này đã có trong Database của mình chưa
    let user = await User.findOne({ email });

    if (user) {
      // Nếu có tài khoản nhưng chưa liên kết Google thì liên kết luôn
      if (!user.googleId) {
        user.googleId = sub;
        user.authProvider = 'google';
        if (!user.avatarUrl) user.avatarUrl = picture;
        await user.save();
      }
    } else {
      // Nếu hoàn toàn là người mới -> Tự động Đăng ký tài khoản
      user = await User.create({
        name,
        email,
        googleId: sub,
        authProvider: 'google',
        avatarUrl: picture
        // Không cần truyền password và phone
      });
    }

    // 4. Trả về Token của hệ thống mình cho Frontend
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      token: generateToken(user._id)
    });

  } catch (error) {
    res.status(401).json({ message: 'Xác thực Google thất bại', error: error.message });
  }
};