const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587, // 👉 ĐỔI TỪ 465 SANG 587
  secure: false, // 👉 BẮT BUỘC ĐỔI THÀNH FALSE KHI DÙNG PORT 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, 
  },
  tls: {
    rejectUnauthorized: false
  }
});

exports.sendOtpEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: `"Personal CRM" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Mã xác thực OTP của bạn',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Xin chào!</h2>
          <p>Mã xác thực OTP của bạn là: <b style="font-size: 24px; color: #4CAF50;">${otp}</b></p>
          <p>Mã này có hiệu lực trong <strong>10 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
          <p style="color: #888; font-size: 12px;">Nếu bạn không yêu cầu mã này, hãy bỏ qua email này.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Đã gửi email thành công: ' + info.response);
    return true;
  } catch (error) {
    console.error('❌ Lỗi khi gửi email:', error);
    throw new Error('Không thể gửi email OTP');
  }
};