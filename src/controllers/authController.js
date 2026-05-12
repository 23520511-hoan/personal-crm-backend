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
// Body: { emailOrPhone, password }
exports.register = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    // 1. Validate đầu vào
    if (!emailOrPhone || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập email/số điện thoại và mật khẩu' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    // 2. Xác định là email hay SĐT
    const isEmailInput = isEmail(emailOrPhone);
    const isPhoneInput = isPhone(emailOrPhone);
    if (!isEmailInput && !isPhoneInput) {
      return res.status(400).json({ message: 'Email hoặc số điện thoại không hợp lệ' });
    }

    const query = isEmailInput ? { email: emailOrPhone } : { phone: emailOrPhone };

    // 3. Kiểm tra đã tồn tại chưa
    const existingUser = await User.findOne(query);
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: 'Email hoặc số điện thoại đã được sử dụng' });
    }

    // 4. Tạo OTP
    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // hết hạn sau 10 phút

    // 5. Mã hóa mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 6. Tạo hoặc cập nhật user (chưa verify)
    let user;
    if (existingUser && !existingUser.isVerified) {
      // Tài khoản cũ chưa verify → cập nhật lại
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

    // 7. Gửi OTP (chỉ hỗ trợ email hiện tại; SĐT cần SMS service)
    if (isEmailInput) {
      await sendOtpEmail(emailOrPhone, otp);
    } else {
      // TODO: tích hợp SMS service (Twilio, ESMS, v.v.)
      // Tạm thời log ra console khi dev
      console.log(`[DEV] OTP cho ${emailOrPhone}: ${otp}`);
    }

    res.status(201).json({
      message: isEmailInput
        ? 'Đã gửi mã OTP đến email của bạn'
        : 'Đã gửi mã OTP đến số điện thoại của bạn',
      emailOrPhone,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi đăng ký', error: error.message });
  }
};

// ─── BƯỚC 2: Xác thực OTP ─────────────────────────────────────────────────────
// [POST] /api/auth/verify-otp
// Body: { emailOrPhone, otp }
exports.verifyOtp = async (req, res) => {
  try {
    const { emailOrPhone, otp } = req.body;

    if (!emailOrPhone || !otp) {
      return res.status(400).json({ message: 'Vui lòng cung cấp email/SĐT và mã OTP' });
    }

    // 1. Tìm user
    const query = isEmail(emailOrPhone) ? { email: emailOrPhone } : { phone: emailOrPhone };
    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({ message: 'Tài khoản không tồn tại' });
    }

    // 2. Kiểm tra OTP
    if (user.otp !== otp) {
      return res.status(400).json({ message: 'Mã OTP không đúng' });
    }
    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'Mã OTP đã hết hạn. Vui lòng đăng ký lại' });
    }

    // 3. Đánh dấu đã verify, xóa OTP
    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    // 4. Trả token để bước tiếp theo setup tên
    res.json({
      message: 'Xác thực thành công',
      token: generateToken(user._id),
      needsName: !user.name, // true → UI điều hướng đến màn nhập tên
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi xác thực OTP', error: error.message });
  }
};

// ─── BƯỚC 3: Cập nhật tên sau khi verify ──────────────────────────────────────
// [POST] /api/auth/setup-name  (yêu cầu Bearer token)
// Body: { name }
exports.setupName = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: 'Vui lòng nhập tên của bạn' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Tài khoản không tồn tại' });
    }

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
// Body: { emailOrPhone, password }
exports.login = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập email/số điện thoại và mật khẩu' });
    }

    // 1. Tìm user bằng email hoặc SĐT
    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
    });

    if (!user) {
      return res.status(401).json({ message: 'Email/Số điện thoại hoặc mật khẩu không đúng' });
    }

    // 2. Kiểm tra đã verify chưa
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Tài khoản chưa được xác thực. Vui lòng kiểm tra OTP' });
    }

    // 3. Kiểm tra mật khẩu
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email/Số điện thoại hoặc mật khẩu không đúng' });
    }

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

    // 1. Xác minh Token với Google
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    // 2. Lấy thông tin từ Google
    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    // 3. Tìm hoặc tạo user
    let user = await User.findOne({ email });

    if (user) {
      if (!user.googleId) {
        user.googleId = sub;
        user.authProvider = 'google';
        if (!user.avatarUrl) user.avatarUrl = picture;
        if (!user.isVerified) user.isVerified = true; // Google đã xác thực email
        await user.save();
      }
    } else {
      user = await User.create({
        name,
        email,
        googleId: sub,
        authProvider: 'google',
        avatarUrl: picture,
        isVerified: true, // Google đã xác thực sẵn
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
