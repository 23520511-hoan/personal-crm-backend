const Contact = require('../models/Contact');

// [POST] /api/contacts/:contactId/special-days - Thêm ngày đặc biệt
exports.addSpecialDay = async (req, res) => {
  try {
    const contact = await Contact.findOne({ 
      _id: req.params.contactId, 
      userId: req.user._id, 
      isDeleted: false 
    });
    
    if (!contact) return res.status(404).json({ message: 'Không tìm thấy liên hệ' });

    // Thêm ngày đặc biệt mới vào mảng specialDays
    contact.specialDays.push(req.body);
    await contact.save();

    // Trả về ngày đặc biệt vừa được thêm (nằm ở cuối mảng)
    const newSpecialDay = contact.specialDays[contact.specialDays.length - 1];
    res.status(201).json(newSpecialDay);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi thêm ngày đặc biệt', error: error.message });
  }
};

// [PATCH] /api/contacts/:contactId/special-days/:specialDayId - Cập nhật ngày đặc biệt
exports.updateSpecialDay = async (req, res) => {
  try {
    const contact = await Contact.findOne({ 
      _id: req.params.contactId, 
      userId: req.user._id, 
      isDeleted: false 
    });
    
    if (!contact) return res.status(404).json({ message: 'Không tìm thấy liên hệ' });

    // Tìm ngày đặc biệt cụ thể trong mảng
    const specialDay = contact.specialDays.id(req.params.specialDayId);
    if (!specialDay) return res.status(404).json({ message: 'Không tìm thấy ngày đặc biệt' });

    // Cập nhật các trường dữ liệu
    if (req.body.occasion) specialDay.occasion = req.body.occasion;
    if (req.body.date) specialDay.date = req.body.date;
    if (req.body.note !== undefined) specialDay.note = req.body.note;
    if (req.body.repeatYearly !== undefined) specialDay.repeatYearly = req.body.repeatYearly;
    
    // Cập nhật reminder (nếu có)
    if (req.body.reminder) {
      specialDay.reminder = { ...specialDay.reminder, ...req.body.reminder };
    }

    await contact.save();
    res.json(specialDay);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi cập nhật ngày đặc biệt', error: error.message });
  }
};

// [DELETE] /api/contacts/:contactId/special-days/:specialDayId - Xóa ngày đặc biệt
exports.deleteSpecialDay = async (req, res) => {
  try {
    const contact = await Contact.findOne({ 
      _id: req.params.contactId, 
      userId: req.user._id, 
      isDeleted: false 
    });
    
    if (!contact) return res.status(404).json({ message: 'Không tìm thấy liên hệ' });

    // Xóa ngày đặc biệt khỏi mảng bằng lệnh pull của Mongoose
    contact.specialDays.pull({ _id: req.params.specialDayId });
    await contact.save();

    res.json({ message: 'Đã xóa ngày đặc biệt' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi xóa ngày đặc biệt', error: error.message });
  }
};