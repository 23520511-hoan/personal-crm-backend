const express = require('express');
const router = express.Router();
const {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  updateNoteReminder,
  deleteNoteReminder
} = require('../controllers/noteController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getNotes)
  .post(createNote);

router.route('/:id')
  .get(getNoteById)
  .patch(updateNote)
  .delete(deleteNote);

// Route xử lý Reminder phải nằm TRÊN module.exports
router.route('/:id/reminder')
  .put(updateNoteReminder)
  .delete(deleteNoteReminder);

// Dòng này LUÔN LUÔN nằm cuối cùng của file
module.exports = router;