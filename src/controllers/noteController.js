const Note = require('../models/Note');
const Contact = require('../models/Contact');

// [GET] /api/notes
exports.getNotes = async (req, res) => {
  try {
    const { contactId, search } = req.query;
    let query = { userId: req.user._id, isDeleted: false };

    if (contactId) query.contactId = contactId;
    if (search) query.content = { $regex: search, $options: 'i' };

    const notes = await Note.find(query)
      .populate('contactId', 'name avatarUrl')
      .sort({ interactionDate: -1 });

    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách ghi chú', error: error.message });
  }
};

// [POST] /api/notes
exports.createNote = async (req, res) => {
  try {
    const { title, content, contactId, contactName, createContactIfMissing, interactionDate } = req.body;
    let finalContactId = contactId;

    if (!finalContactId) {
      if (contactName && createContactIfMissing) {
        let contact = await Contact.findOne({ 
          userId: req.user._id, 
          name: { $regex: new RegExp('^' + contactName + '$', 'i') },
          isDeleted: false 
        });

        if (!contact) {
          contact = await Contact.create({ userId: req.user._id, name: contactName });
        }
        finalContactId = contact._id;
      } else {
        return res.status(400).json({ message: 'Contact is required to create a note.' });
      }
    } else {
      const contactExists = await Contact.findOne({ _id: finalContactId, userId: req.user._id, isDeleted: false });
      if (!contactExists) {
        return res.status(404).json({ message: 'Liên hệ không tồn tại hoặc đã bị xóa.' });
      }
    }

    const note = await Note.create({
      userId: req.user._id,
      contactId: finalContactId,
      title: title || '',
      content,
      interactionDate: interactionDate || Date.now()
    });

    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi tạo ghi chú', error: error.message });
  }
};

// [PATCH] /api/notes/:id
exports.updateNote = async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, isDeleted: false },
      req.body,
      { new: true }
    );

    if (!note) return res.status(404).json({ message: 'Không tìm thấy ghi chú' });
    res.json(note);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi cập nhật ghi chú', error: error.message });
  }
};

// [DELETE] /api/notes/:id
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );

    if (!note) return res.status(404).json({ message: 'Không tìm thấy ghi chú' });
    res.json({ message: 'Đã đưa ghi chú vào thùng rác' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi xóa ghi chú', error: error.message });
  }
};

// [PUT] /api/notes/:id/reminder
exports.updateNoteReminder = async (req, res) => {
  try {
    const { enabled, remindAt, content } = req.body;
    
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, isDeleted: false },
      {
        $set: {
          'reminder.enabled': enabled,
          'reminder.remindAt': remindAt,
          'reminder.content': content,
          'reminder.isSent': false
        }
      },
      { new: true }
    );

    if (!note) return res.status(404).json({ message: 'Không tìm thấy ghi chú' });
    res.json(note);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi cập nhật nhắc nhở', error: error.message });
  }
};

// [DELETE] /api/notes/:id/reminder
exports.deleteNoteReminder = async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id, isDeleted: false },
      {
        $set: {
          'reminder.enabled': false,
          'reminder.remindAt': null,
          'reminder.content': '',
          'reminder.isSent': false
        }
      },
      { new: true }
    );

    if (!note) return res.status(404).json({ message: 'Không tìm thấy ghi chú' });
    res.json({ message: 'Đã xóa nhắc nhở khỏi ghi chú', note });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi xóa nhắc nhở', error: error.message });
  }
};