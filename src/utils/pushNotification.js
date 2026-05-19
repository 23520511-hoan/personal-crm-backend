const { Expo } = require('expo-server-sdk');

// Khởi tạo SDK
let expo = new Expo();

/**
 * Hàm gửi thông báo đẩy (Push Notification)
 * @param {Object} targetUser - Object user lấy từ Database (phải có expoPushToken)
 * @param {String} title - Tiêu đề thông báo (VD: "Sinh nhật sắp tới!")
 * @param {String} body - Nội dung thông báo
 * @param {Object} data - (Tùy chọn) Data ẩn gửi kèm để click vào thì chuyển màn hình
 */
exports.sendPushNotification = async (targetUser, title, body, data = {}) => {
  // 1. Kiểm tra xem user này có token hợp lệ không
  if (!targetUser.expoPushToken || !Expo.isExpoPushToken(targetUser.expoPushToken)) {
    console.log(`⚠️ Bỏ qua: User ${targetUser.name || targetUser.email} chưa đăng ký Push Token hợp lệ.`);
    return;
  }

  // 2. Đóng gói gói tin
  let messages = [{
    to: targetUser.expoPushToken,
    sound: 'default', // Kêu tiếng "ting" khi nhận thông báo
    title: title,
    body: body,
    data: data,
  }];

  // 3. Gửi đi thông qua server của Expo
  try {
    let chunks = expo.chunkPushNotifications(messages);
    for (let chunk of chunks) {
      let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      console.log("✅ ĐÃ GỬI PUSH NOTIFICATION THÀNH CÔNG:", ticketChunk);
    }
  } catch (error) {
    console.error("❌ LỖI KHI GỬI PUSH NOTIFICATION:", error);
  }
};