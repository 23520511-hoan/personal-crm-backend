const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App Password của Gmail
  },
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

  await transporter.sendMail(mailOptions);
};

module.exports = { sendOtpEmail };
