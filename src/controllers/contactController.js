const Contact = require('../models/Contact');
const Note = require('../models/Note'); // Bổ sung dòng này để lấy Ghi chú
const mongoose = require('mongoose');

// [GET] /api/contacts - Lấy danh sách liên hệ (Có hỗ trợ tìm kiếm và lọc)
exports.getContacts = async (req, res) => {
  try {
    const { search, statusId, source } = req.query;
    
    // Mặc định chỉ lấy những contact chưa bị xóa mềm
    let query = { userId: req.user._id, isDeleted: false };

    // Xử lý query tìm kiếm theo tên (không phân biệt hoa thường)
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (statusId) query.statusId = statusId;
    if (source) query.source = source;

    // Lấy danh sách và "kéo" thêm thông tin của Status (name, color) để Frontend dễ hiển thị
    const contacts = await Contact.find(query)
      .populate('statusId', 'name color')
      .sort({ createdAt: -1 }); // Mới nhất lên đầu

    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách liên hệ', error: error.message });
  }
};

// [GET] /api/contacts/:id - Lấy chi tiết 1 Contact để Frontend fill vào form Edit
exports.getContactById = async (req, res) => {
  try {
    const contact = await Contact.findOne({
      _id: req.params.id,
      userId: req.user._id, // Đảm bảo chỉ lấy contact của user đang đăng nhập
      isDeleted: false
    });

    if (!contact) {
      return res.status(404).json({ message: 'Không tìm thấy liên hệ' });
    }

    res.json(contact);
  } catch (error) {
    console.error("Lỗi lấy chi tiết Contact:", error);
    res.status(500).json({ message: 'Lỗi server khi lấy liên hệ', error: error.message });
  }
};

// [POST] /api/contacts - Tạo liên hệ đầy đủ
exports.createContact = async (req, res) => {
  try {
    console.log("=== DỮ LIỆU FRONTEND GỬI LÊN ĐỂ TẠO CONTACT ===", req.body);
    
    const contactData = { ...req.body, userId: req.user._id };
    
    // TẤM KHIÊN THÉP: Kiểm tra xem statusId có phải ID chuẩn 24 ký tự của MongoDB không
    if (contactData.statusId && !mongoose.Types.ObjectId.isValid(contactData.statusId)) {
      console.log(`⚠️ Bỏ qua statusId dỏm từ Frontend: ${contactData.statusId}`);
      delete contactData.statusId; 
    }

    const contact = await Contact.create(contactData);
    res.status(201).json(contact);
  } catch (error) {
    console.error("!!! BẮT ĐƯỢC LỖI TẠO CONTACT !!!", error);
    res.status(500).json({ message: 'Lỗi server khi tạo liên hệ', error: error.message });
  }
};

// [POST] /api/contacts/quick - Tạo nhanh liên hệ (Chỉ cần tên, dùng lúc tạo Note nhanh)
exports.quickCreateContact = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Tên liên hệ là bắt buộc' });

    const contact = await Contact.create({
      userId: req.user._id,
      name: name
    });

    res.status(201).json(contact);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi tạo nhanh liên hệ', error: error.message });
  }
};

// [PATCH/PUT] /api/contacts/:id
exports.updateContact = async (req, res) => {
  try {
    console.log(`=== DỮ LIỆU FRONTEND GỬI UPDATE CONTACT (${req.params.id}) ===`, req.body);
    
    const updateData = { ...req.body };

    // TẤM KHIÊN THÉP: Chặn ID dỏm giống y hệt lúc Create
    if (updateData.statusId && !mongoose.Types.ObjectId.isValid(updateData.statusId)) {
      console.log(`⚠️ Update: Bỏ qua statusId dỏm từ Frontend: ${updateData.statusId}`);
      delete updateData.statusId; 
    }

    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, isDeleted: false },
      updateData,
      { new: true } // Tham số này giúp trả về cục data mới nhất sau khi update
    );

    if (!contact) {
      return res.status(404).json({ message: 'Không tìm thấy liên hệ' });
    }

    res.json(contact);
  } catch (error) {
    console.error("!!! BẮT ĐƯỢC LỖI UPDATE CONTACT !!!", error);
    res.status(500).json({ message: 'Lỗi server khi cập nhật liên hệ', error: error.message });
  }
};

// [DELETE] /api/contacts/:id - Xóa mềm liên hệ
exports.deleteContact = async (req, res) => {
  try {
    // Xóa mềm: Không xóa hẳn khỏi DB, chỉ đổi cờ isDeleted thành true và lưu ngày xóa
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!contact) return res.status(404).json({ message: 'Không tìm thấy liên hệ' });

    res.json({ message: 'Đã đưa liên hệ vào thùng rác (xóa mềm)' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi xóa liên hệ', error: error.message });
  }
};

// [GET] /api/contacts/:id/timeline - Lấy dòng thời gian của liên hệ
exports.getContactTimeline = async (req, res) => {
    try {
      const contactId = req.params.id;
  
      // 1. Lấy thông tin Contact (để lấy specialDays)
      const contact = await Contact.findOne({ 
        _id: contactId, 
        userId: req.user._id, 
        isDeleted: false 
      });
  
      if (!contact) return res.status(404).json({ message: 'Không tìm thấy liên hệ' });
  
      // 2. Lấy toàn bộ Ghi chú của Contact này
      const notes = await Note.find({ 
        contactId: contactId, 
        userId: req.user._id, 
        isDeleted: false 
      });
  
      // 3. Chuẩn hóa dữ liệu Ghi chú để ghép vào Timeline
      const formattedNotes = notes.map(note => ({
        type: 'NOTE',
        id: note._id,
        title: note.title,
        content: note.content,
        date: note.interactionDate, // Dùng interactionDate để xếp hạng
        reminder: note.reminder
      }));
  
      // 4. Chuẩn hóa dữ liệu Ngày đặc biệt để ghép vào Timeline
      const formattedSpecialDays = contact.specialDays.map(sd => ({
        type: 'SPECIAL_DAY',
        id: sd._id,
        occasion: sd.occasion,
        content: sd.note || '', // Đổi tên trường cho đồng nhất với Note
        date: sd.date,
        reminder: sd.reminder
      }));
  
      // 5. Trộn 2 mảng lại và Sắp xếp theo ngày (Mới nhất lên đầu)
      const timeline = [...formattedNotes, ...formattedSpecialDays].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });
  
      // 6. Trả về đúng format V1 mà bạn thiết kế
      res.json({
        contact: {
          _id: contact._id,
          name: contact.name,
          avatarUrl: contact.avatarUrl
        },
        timeline: timeline
      });
  
    } catch (error) {
      res.status(500).json({ message: 'Lỗi server khi lấy dòng thời gian', error: error.message });
    }
  };