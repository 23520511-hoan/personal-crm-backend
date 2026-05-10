const express = require('express');
const router = express.Router();
const { getStatuses, createStatus, updateStatus, deleteStatus } = require('../controllers/statusController');
const { protect } = require('../middleware/authMiddleware');

// Tất cả API về Status đều cần phải đăng nhập
router.use(protect);

router.route('/')
  .get(getStatuses)
  .post(createStatus);

router.route('/:id')
  .patch(updateStatus)
  .delete(deleteStatus);

module.exports = router;