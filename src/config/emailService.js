const nodemailer = require('nodemailer');

// 👉 Cục cấu hình mới chống văng lỗi trên Cloud
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // Bắt buộc dùng host thay vì service
  port: 465,
  secure: true, // Dùng SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false // Bỏ qua lỗi chứng chỉ của server Render
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
          <p>Mã này sẽ hết hạn trong vòng 10 phút.</p>
          <p>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Đã gửi email thành công: ' + info.response);
    return true;
  } catch (error) {
    console.error('❌ Lỗi khi gửi email:', error);
    throw new Error('Không thể gửi email OTP');
  }
};