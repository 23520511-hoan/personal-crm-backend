const cron = require('node-cron');
const Note = require('../models/Note');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendPushNotification } = require('./pushNotification');

/**
 * Cron job chạy mỗi phút để kiểm tra reminder đến hạn
 * Khi đến giờ → Tạo Notification + Gửi Push Notification
 */
const startReminderJob = () => {
  // Chạy mỗi phút: '* * * * *'
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      // Tìm tất cả note có reminder đến hạn, chưa gửi
      const dueNotes = await Note.find({
        isDeleted: false,
        'reminder.enabled': true,
        'reminder.isSent': false,
        'reminder.remindAt': { $lte: now },
      }).populate('contactId', 'name');

      if (dueNotes.length === 0) return;

      console.log(`⏰ [ReminderJob] Tìm thấy ${dueNotes.length} reminder đến hạn`);

      for (const note of dueNotes) {
        try {
          const contactName = note.contactId?.name || 'liên hệ';
          const reminderContent = note.reminder.content || note.content || `Nhắc nhở về ${contactName}`;

          // 1. Tạo Notification trong DB
          await Notification.create({
            userId: note.userId,
            content: reminderContent,
            type: 'REMINDER',
            relatedId: note._id,
            onModel: 'Note',
            isRead: false,
          });

          // 2. Gửi Push Notification qua Expo
          const user = await User.findById(note.userId);
          if (user) {
            await sendPushNotification(
              user,
              '⏰ Nhắc nhở',
              reminderContent,
              {
                screen: 'NoteDetail',
                noteId: String(note._id),
                contactId: String(note.contactId?._id || ''),
              }
            );
          }

          // 3. Đánh dấu đã gửi
          note.reminder.isSent = true;
          await note.save();

          console.log(`✅ [ReminderJob] Đã gửi reminder cho note: ${note._id}`);
        } catch (err) {
          console.error(`❌ [ReminderJob] Lỗi khi xử lý note ${note._id}:`, err.message);
        }
      }
    } catch (err) {
      console.error('❌ [ReminderJob] Lỗi cron job:', err.message);
    }
  });

  console.log('✅ [ReminderJob] Cron job đã khởi động - kiểm tra mỗi phút');
};

module.exports = { startReminderJob };
