const Status = require('../models/Status');
const Contact = require('../models/Contact');

// [GET] /api/statuses - Lấy danh sách trạng thái của user
exports.getStatuses = async (req, res) => {
  try {
    let statuses = await Status.find({ userId: req.user._id, isDeleted: false });
    
    if (statuses.length === 0) {
      // Đếm xem thực sự user đã có status nào trong database chưa (kể cả cái bị lỗi/ẩn)
      const totalCount = await Status.countDocuments({ userId: req.user._id });
      
      if (totalCount === 0) {
        const defaultStatuses = [
          { userId: req.user._id, name: 'Close Friend', color: '#FF5733', icon: 'heart' },
          { userId: req.user._id, name: 'Work', color: '#3357FF', icon: 'briefcase' },
          { userId: req.user._id, name: 'Other', color: '#808080', icon: 'user' }
        ];
        try {
          await Status.insertMany(defaultStatuses);
        } catch (insertError) {
          console.log("⚠️ Bỏ qua lỗi trùng tên Status mặc định");
        }
      }
      // Query lại sau khi xử lý
      statuses = await Status.find({ userId: req.user._id, isDeleted: false });
    }
    
    res.json(statuses);
  } catch (error) {
    console.error("!!! LỖI GET STATUS LIST !!!", error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// [POST] /api/statuses - Tạo trạng thái mới
exports.createStatus = async (req, res) => {
  try {
    const { name, color } = req.body;

    // Kiểm tra xem tên status đã tồn tại chưa (trong phạm vi của user đó)
    const existingStatus = await Status.findOne({ userId: req.user._id, name });
    if (existingStatus) {
      return res.status(400).json({ message: 'Tên trạng thái này đã tồn tại' });
    }

    const status = await Status.create({
      userId: req.user._id,
      name,
      color
    });

    res.status(201).json(status);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi tạo trạng thái', error: error.message });
  }
};

// [PATCH] /api/statuses/:id - Cập nhật trạng thái
exports.updateStatus = async (req, res) => {
  try {
    const status = await Status.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true }
    );

    if (!status) return res.status(404).json({ message: 'Không tìm thấy trạng thái' });
    res.json(status);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái', error: error.message });
  }
};

// [DELETE] /api/statuses/:id - Xóa trạng thái
exports.deleteStatus = async (req, res) => {
  try {
    const statusId = req.params.id;

    const status = await Status.findOneAndDelete({ _id: statusId, userId: req.user._id });

    if (!status) {
      return res.status(404).json({ message: 'Không tìm thấy trạng thái để xóa' });
    }

    // LOGIC QUAN TRỌNG: Gỡ statusId khỏi toàn bộ Contact đang sử dụng nó
    // Theo yêu cầu của bạn: "Khi xóa status thì xóa trường 'status' của những người thuộc về status đó"
    await Contact.updateMany(
      { userId: req.user._id, statusId: statusId },
      { $set: { statusId: null } }
    );

    res.json({ message: 'Đã xóa trạng thái và cập nhật các liên hệ liên quan' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi xóa trạng thái', error: error.message });
  }
};