const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { sendOtpEmail } = require('../config/emailService');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Helper ───────────────────────────────────────────────────────────────────

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 chữ số
};

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isPhone = (value) => /^(0|\+84)[0-9]{8,10}$/.test(value);

// ─── BƯỚC 1: Đăng ký - chỉ cần email/SĐT + mật khẩu ──────────────────────────
// [POST] /api/auth/register
exports.register = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập email/số điện thoại và mật khẩu' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    const isEmailInput = isEmail(emailOrPhone);
    const isPhoneInput = isPhone(emailOrPhone);
    if (!isEmailInput && !isPhoneInput) {
      return res.status(400).json({ message: 'Email hoặc số điện thoại không hợp lệ' });
    }

    const query = isEmailInput ? { email: emailOrPhone } : { phone: emailOrPhone };
    const existingUser = await User.findOne(query);

    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: 'Email hoặc số điện thoại đã được sử dụng' });
    }

    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // hết hạn sau 10 phút

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let user;
    if (existingUser && !existingUser.isVerified) {
      existingUser.password = hashedPassword;
      existingUser.otp = otp;
      existingUser.otpExpiry = otpExpiry;
      user = await existingUser.save();
    } else {
      user = await User.create({
        ...(isEmailInput ? { email: emailOrPhone } : { phone: emailOrPhone }),
        password: hashedPassword,
        otp,
        otpExpiry,
        isVerified: false,
      });
    }

    if (isEmailInput) {
      await sendOtpEmail(emailOrPhone, otp);
    } else {
      console.log(`[DEV] OTP cho ${emailOrPhone}: ${otp}`);
    }

    res.status(201).json({
      message: isEmailInput ? 'Đã gửi mã OTP đến email của bạn' : 'Đã gửi mã OTP đến số điện thoại của bạn',
      emailOrPhone,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi đăng ký', error: error.message });
  }
};

// ─── GỬI LẠI OTP (Dùng chung cho Đăng ký hoặc Quên mật khẩu) ─────────────────
// [POST] /api/auth/resend-otp
exports.resendOtp = async (req, res) => {
  try {
    const { emailOrPhone } = req.body;
    if (!emailOrPhone) return res.status(400).json({ message: 'Vui lòng cung cấp email/số điện thoại' });

    const isEmailInput = isEmail(emailOrPhone);
    const query = isEmailInput ? { email: emailOrPhone } : { phone: emailOrPhone };
    
    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ message: 'Tài khoản không tồn tại' });

    const otp = generateOtp();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // Thêm 10 phút
    await user.save();

    if (isEmailInput) {
      await sendOtpEmail(emailOrPhone, otp);
    } else {
      console.log(`[DEV RESEND] OTP cho ${emailOrPhone}: ${otp}`);
    }

    res.json({ message: 'Đã gửi lại mã OTP thành công.' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi gửi lại OTP', error: error.message });
  }
};

// ─── BƯỚC 2: Xác thực OTP ─────────────────────────────────────────────────────
// [POST] /api/auth/verify-otp
exports.verifyOtp = async (req, res) => {
  try {
    const { emailOrPhone, otp } = req.body;

    if (!emailOrPhone || !otp) {
      return res.status(400).json({ message: 'Vui lòng cung cấp email/SĐT và mã OTP' });
    }

    const query = isEmail(emailOrPhone) ? { email: emailOrPhone } : { phone: emailOrPhone };
    const user = await User.findOne(query);

    if (!user) return res.status(404).json({ message: 'Tài khoản không tồn tại' });

    if (user.otp !== otp) return res.status(400).json({ message: 'Mã OTP không đúng' });
    if (user.otpExpiry < new Date()) return res.status(400).json({ message: 'Mã OTP đã hết hạn. Vui lòng lấy mã mới' });

    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.json({
      message: 'Xác thực thành công',
      token: generateToken(user._id),
      needsName: !user.name, 
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi xác thực OTP', error: error.message });
  }
};

// ─── BƯỚC 3: Cập nhật tên sau khi verify ──────────────────────────────────────
// [POST] /api/auth/setup-name
exports.setupName = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Vui lòng nhập tên của bạn' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Tài khoản không tồn tại' });

    user.name = name.trim();
    await user.save();

    res.json({
      message: 'Cập nhật tên thành công',
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi cập nhật tên', error: error.message });
  }
};

// ─── ĐĂNG NHẬP ────────────────────────────────────────────────────────────────
// [POST] /api/auth/login
exports.login = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập email/số điện thoại và mật khẩu' });
    }

    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
    });

    if (!user) return res.status(401).json({ message: 'Email/Số điện thoại hoặc mật khẩu không đúng' });
    if (!user.isVerified) return res.status(403).json({ message: 'Tài khoản chưa được xác thực. Vui lòng kiểm tra OTP' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Email/Số điện thoại hoặc mật khẩu không đúng' });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi đăng nhập', error: error.message });
  }
};

// ─── ĐĂNG NHẬP GOOGLE ─────────────────────────────────────────────────────────
// [POST] /api/auth/google
exports.googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    let user = await User.findOne({ email });

    if (user) {
      if (!user.googleId) {
        user.googleId = sub;
        user.authProvider = 'google';
        if (!user.avatarUrl) user.avatarUrl = picture;
        if (!user.isVerified) user.isVerified = true;
        await user.save();
      }
    } else {
      user = await User.create({
        name,
        email,
        googleId: sub,
        authProvider: 'google',
        avatarUrl: picture,
        isVerified: true,
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(401).json({ message: 'Xác thực Google thất bại', error: error.message });
  }
};

// ─── QUÊN MẬT KHẨU (Gửi OTP) ──────────────────────────────────────────────────
// [POST] /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { emailOrPhone } = req.body;
    if (!emailOrPhone) return res.status(400).json({ message: 'Vui lòng cung cấp email/số điện thoại' });

    const isEmailInput = isEmail(emailOrPhone);
    const query = isEmailInput ? { email: emailOrPhone } : { phone: emailOrPhone };
    
    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ message: 'Tài khoản không tồn tại' });

    // Tạo mã OTP và lưu vào DB
    const otp = generateOtp();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    if (isEmailInput) {
      await sendOtpEmail(emailOrPhone, otp);
    } else {
      console.log(`[DEV FORGOT PASS] OTP cho ${emailOrPhone}: ${otp}`);
    }

    res.json({ message: 'Mã OTP đã được gửi. Vui lòng kiểm tra.' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi yêu cầu lấy lại mật khẩu', error: error.message });
  }
};

// ─── ĐẶT LẠI MẬT KHẨU MỚI (Sau khi có OTP) ────────────────────────────────────
// [POST] /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { emailOrPhone, otp, newPassword } = req.body;

    if (!emailOrPhone || !otp || !newPassword) {
      return res.status(400).json({ message: 'Vui lòng nhập đủ thông tin' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    const query = isEmail(emailOrPhone) ? { email: emailOrPhone } : { phone: emailOrPhone };
    
    // 1. Tìm user trước
    const user = await User.findOne(query);
    if (!user) {
      return res.status(404).json({ message: 'Tài khoản không tồn tại.' });
    }

    // 2. Tách ra check OTP riêng để bắt lỗi chuẩn xác
    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Mã OTP không đúng.' });
    }
    
    // 3. Check thời gian hết hạn riêng bằng new Date() cho chuẩn hệ thống
    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'Mã OTP đã hết hạn. Vui lòng lấy mã mới.' });
    }

    // Mã hóa mật khẩu mới và xóa mã OTP
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    res.json({ message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay bây giờ.' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi đặt lại mật khẩu', error: error.message });
  }
};

// ─── ĐỔI MẬT KHẨU (Trong mục Setting khi đã đăng nhập) ────────────────────────
// [PUT] /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ message: 'Vui lòng nhập đủ mật khẩu cũ và mới' });

    const user = await User.findById(req.user._id);

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng.' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Đổi mật khẩu thành công.' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi đổi mật khẩu', error: error.message });
  }
};