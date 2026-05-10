const Note = require('../models/Note');
const Contact = require('../models/Contact');
const Notification = require('../models/Notification');

// [GET] /api/dashboard - Lấy dữ liệu tổng quan cho màn hình Trang chủ
exports.getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Lấy 5 Ghi chú mới tương tác gần đây nhất
    const recentNotes = await Note.find({ userId, isDeleted: false })
      .sort({ interactionDate: -1 })
      .limit(5)
      .populate('contactId', 'name avatarUrl statusId');

    // 2. Lấy 5 Nhắc nhở (Reminder của Note) sắp tới
    const upcomingReminders = await Note.find({
      userId,
      isDeleted: false,
      'reminder.enabled': true,
      'reminder.remindAt': { $gte: new Date() } // Chỉ lấy nhắc nhở ở tương lai
    })
      .sort({ 'reminder.remindAt': 1 }) // Gần nhất lên đầu
      .limit(5)
      .populate('contactId', 'name avatarUrl');

    // 3. Lấy 5 Liên hệ mới được cập nhật/thêm gần đây
    const recentContacts = await Contact.find({ userId, isDeleted: false })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('statusId', 'name color');

    // 4. Số lượng thông báo chưa đọc
    const unreadNotificationCount = await Notification.countDocuments({
      userId,
      isRead: false
    });

    // 5. Lấy Ngày đặc biệt (Special Days) sắp tới (trong vòng 30 ngày tới)
    const contactsWithSpecialDays = await Contact.find({
      userId,
      isDeleted: false,
      'specialDays.0': { $exists: true } // Chỉ lấy những người có ít nhất 1 ngày đặc biệt
    });

    let upcomingSpecialDays = [];
    const today = new Date();
    const next30Days = new Date(today);
    next30Days.setDate(today.getDate() + 30);

    contactsWithSpecialDays.forEach(contact => {
      contact.specialDays.forEach(sd => {
        const sdDate = new Date(sd.date);
        // Đưa ngày đặc biệt về năm hiện tại để so sánh
        const thisYearDate = new Date(today.getFullYear(), sdDate.getMonth(), sdDate.getDate());
        
        // Nếu ngày đó trong năm nay đã qua, và có lặp lại hàng năm, thì tính cho năm sau
        if (thisYearDate < today && sd.repeatYearly) {
            thisYearDate.setFullYear(today.getFullYear() + 1);
        }

        // Lọc những ngày nằm trong khoảng 30 ngày tới
        if (thisYearDate >= today && thisYearDate <= next30Days) {
          upcomingSpecialDays.push({
            contactId: contact._id,
            contactName: contact.name,
            specialDayId: sd._id,
            occasion: sd.occasion,
            date: thisYearDate, // Ngày sẽ diễn ra sự kiện
            originalDate: sd.date // Ngày sinh/kỷ niệm gốc
          });
        }
      });
    });

    // Sắp xếp ngày đặc biệt gần nhất lên đầu và chỉ lấy 5 cái
    upcomingSpecialDays.sort((a, b) => a.date - b.date);
    upcomingSpecialDays = upcomingSpecialDays.slice(0, 5);

    // TRẢ VỀ TOÀN BỘ DATA CHO FRONTEND RENDER TRANG CHỦ
    res.json({
      recentNotes,
      upcomingReminders,
      upcomingSpecialDays,
      recentContacts,
      unreadNotificationCount
    });

  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi tải Dashboard', error: error.message });
  }
};