const nodemailer = require('nodemailer');

// FIX: Render không hỗ trợ IPv6 outbound tốt → force IPv4 bằng family: 4
// Đồng thời dùng host/port explicit thay vì `service: 'gmail'` để chủ động kiểm soát
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true cho port 465, false cho port 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App Password của Gmail
  },
  // FIX QUAN TRỌNG: Bắt buộc dùng IPv4 để tránh lỗi ENETUNREACH trên Render
  tls: {
    rejectUnauthorized: false,
  },
  // Ép DNS lookup chỉ trả về IPv4 (family: 4)
  family: 4,
});

// Test kết nối khi server khởi động (chỉ log, không crash app nếu lỗi)
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ [EmailService] Lỗi kết nối SMTP:', error.message);
  } else {
    console.log('✅ [EmailService] Sẵn sàng gửi email');
  }
});

/**
 * Gửi OTP qua email
 * @param {string} toEmail - Email nhận
 * @param {string} otp - Mã OTP 6 số
 */
const sendOtpEmail = async (toEmail, otp) => {
  const mailOptions = {
    from: `"Personal CRM" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Mã xác thực tài khoản của bạn',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border: 1px solid #e0e0e0; border-radius: 12px;">
        <h2 style="color: #1a4731; text-align: center;">Personal CRM</h2>
        <p>Xin chào,</p>
        <p>Mã xác thực của bạn là:</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a4731;">${otp}</span>
        </div>
        <p>Mã có hiệu lực trong <strong>10 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
        <p style="color: #888; font-size: 12px;">Nếu bạn không yêu cầu mã này, hãy bỏ qua email này.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [EmailService] Đã gửi OTP đến ${toEmail}, messageId: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ [EmailService] Gửi email thất bại đến ${toEmail}:`, error.message);
    throw error; // Ném lại để controller xử lý
  }
};

module.exports = { sendOtpEmail };
