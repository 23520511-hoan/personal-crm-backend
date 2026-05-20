const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
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
          <p>Mã này có hiệu lực trong <strong>10 phút</strong>.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Đã gửi email OTP thành công đến ${email}`);
    return true;
  } catch (error) {
    // KHI CHẠY TRÊN RENDER FREE SẼ RƠI VÀO ĐÂY DO BỊ CHẶN PORT SMTP
    console.error('❌ Render chặn gửi Mail SMTP. Đang bật chế độ DEV TEST.');
    
    // In thẳng mã OTP ra log để Frontend dev (Trung) nhìn thấy và test
    console.log(`\n=========================================`);
    console.log(`🚨 MÃ OTP CỦA [${email}] LÀ: ${otp}`);
    console.log(`=========================================\n`);
    
    // Bỏ lệnh 'throw new Error' để API KHÔNG BỊ CRASH, vẫn trả về HTTP 201 cho Frontend
    return true; 
  }
};