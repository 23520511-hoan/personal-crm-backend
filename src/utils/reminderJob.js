const cron = require('node-cron');
const Note = require('../models/Note');
const User = require('../models/User');
const Contact = require('../models/Contact'); // 👉 Bắt buộc phải import Contact để quét Ngày đặc biệt
const Notification = require('../models/Notification');
const { sendPushNotification } = require('./pushNotification');

/**
 * Cron job chạy mỗi phút để kiểm tra reminder đến hạn
 * Tích hợp đa tầng: Nhắc trước 2h, nhắc đúng giờ, nhắc ngày đặc biệt trước 2 ngày
 */
const startReminderJob = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      // =================================================================
      // 1. NHIỆM VỤ 1: NHẮC SỚM TRƯỚC 2 TIẾNG CHO NOTE
      // =================================================================
      const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      const preDueNotes = await Note.find({
        isDeleted: false,
        'reminder.enabled': true,
        'reminder.isTwoHourSent': false, // Chưa gửi nhắc trước 2h
        'reminder.remindAt': { $lte: twoHoursFromNow, $gt: now }, // Rơi vào khung 2 tiếng tới
      }).populate('contactId', 'name');

      for (const note of preDueNotes) {
        try {
          const contactName = note.contactId?.name || 'liên hệ';
          const reminderContent = note.reminder.content || note.content || `Nhắc nhở về ${contactName}`;
          const msg = `[Sắp diễn ra] Còn 2 tiếng nữa: ${reminderContent}`;

          await Notification.create({
            userId: note.userId, content: msg, type: 'REMINDER', relatedId: note._id, onModel: 'Note', isRead: false
          });

          const user = await User.findById(note.userId);
          if (user) {
            await sendPushNotification(user, '⏰ Sắp đến lịch hẹn (Trong 2 giờ tới)', msg, { 
              screen: 'NoteDetail', noteId: String(note._id), contactId: String(note.contactId?._id || '') 
            });
          }

          // Đánh dấu đã gửi trước 2h
          note.reminder.isTwoHourSent = true;
          await note.save();
          console.log(`✅ [ReminderJob] Đã gửi thông báo sớm 2h cho note: ${note._id}`);
        } catch (err) {
          console.error(`❌ [ReminderJob] Lỗi xử lý thông báo sớm note ${note._id}:`, err.message);
        }
      }

      // =================================================================
      // 2. NHIỆM VỤ 2: NHẮC ĐÚNG GIỜ CHO NOTE
      // =================================================================
      const dueNotes = await Note.find({
        isDeleted: false,
        'reminder.enabled': true,
        'reminder.isSent': false,
        'reminder.remindAt': { $lte: now },
      }).populate('contactId', 'name');

      for (const note of dueNotes) {
        try {
          const contactName = note.contactId?.name || 'liên hệ';
          const reminderContent = note.reminder.content || note.content || `Nhắc nhở về ${contactName}`;
          const msg = `[Đến giờ] ${reminderContent}`;

          await Notification.create({
            userId: note.userId, content: msg, type: 'REMINDER', relatedId: note._id, onModel: 'Note', isRead: false
          });

          const user = await User.findById(note.userId);
          if (user) {
            await sendPushNotification(user, '⏰ Đến giờ hẹn!', msg, { 
              screen: 'NoteDetail', noteId: String(note._id), contactId: String(note.contactId?._id || '') 
            });
          }

          // Đánh dấu đã gửi đúng giờ
          note.reminder.isSent = true;
          await note.save();
          console.log(`✅ [ReminderJob] Đã gửi reminder ĐÚNG GIỜ cho note: ${note._id}`);
        } catch (err) {
          console.error(`❌ [ReminderJob] Lỗi xử lý đúng giờ note ${note._id}:`, err.message);
        }
      }

      // =================================================================
      // 3. NHIỆM VỤ 3: NHẮC NGÀY ĐẶC BIỆT TRƯỚC 2 NGÀY (SPECIAL DAYS)
      // =================================================================
      // Chỉ kích hoạt đúng 1 lần vào 08:00 sáng để tránh spam thông báo liên tục
      if (now.getHours() === 8 && now.getMinutes() === 0) {
        console.log('📅 [ReminderJob] Bắt đầu quét ngày đặc biệt của liên hệ...');
        
        // Tính mốc thời gian của 2 ngày sau
        const targetDate = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
        const targetMonth = targetDate.getMonth() + 1; // Tháng (1-12)
        const targetDay = targetDate.getDate(); // Ngày (1-31)

        // Lấy tất cả contact có chứa ngày đặc biệt
        const contacts = await Contact.find({
          isDeleted: false,
          specialDays: { $exists: true, $not: { $size: 0 } }
        });

        for (const contact of contacts) {
          for (const day of contact.specialDays) {
            if (!day.date) continue; // Bỏ qua nếu data bị lỗi không có ngày

            const sDate = new Date(day.date);
            const sMonth = sDate.getMonth() + 1;
            const sDay = sDate.getDate();

            // Chỉ so sánh Ngày và Tháng (bỏ qua Năm vì sinh nhật, kỷ niệm lặp lại hàng năm)
            if (sMonth === targetMonth && sDay === targetDay) {
              try {
                const msg = `Còn 2 ngày nữa là đến [${day.name}] của ${contact.name}!`;

                await Notification.create({
                  userId: contact.userId, content: msg, type: 'REMINDER', relatedId: contact._id, onModel: 'Contact', isRead: false
                });

                const user = await User.findById(contact.userId);
                if (user) {
                  await sendPushNotification(user, '📅 Sự kiện sắp tới', msg, { 
                    screen: 'ContactDetail', contactId: String(contact._id) 
                  });
                }
                console.log(`✅ [ReminderJob] Đã nhắc ngày đặc biệt [${day.name}] của contact: ${contact.name}`);
              } catch (err) {
                console.error(`❌ [ReminderJob] Lỗi nhắc ngày đặc biệt contact ${contact._id}:`, err.message);
              }
            }
          }
        }
      }

    } catch (err) {
      console.error('❌ [ReminderJob] Lỗi tổng hệ thống cron job:', err.message);
    }
  });

  console.log('✅ [ReminderJob] Cron job ĐA TẦNG đã khởi động - kiểm tra mỗi phút');
};

module.exports = { startReminderJob };