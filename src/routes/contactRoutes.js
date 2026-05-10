const express = require('express');
const router = express.Router();
const { 
  getContacts, 
  getContactById, 
  createContact, 
  quickCreateContact, 
  updateContact, 
  deleteContact,
  getContactTimeline // Bổ sung hàm này
} = require('../controllers/contactController');

const { 
  addSpecialDay, 
  updateSpecialDay, 
  deleteSpecialDay 
} = require('../controllers/specialDayController');

const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.route('/')
  .get(getContacts)
  .post(createContact);

router.post('/quick', quickCreateContact);

// QUAN TRỌNG: Đặt route timeline ở đây (trước /:id)
router.get('/:id/timeline', getContactTimeline);

router.route('/:id')
  .get(getContactById)
  .patch(updateContact)
  .delete(deleteContact);

router.post('/:contactId/special-days', addSpecialDay);
router.patch('/:contactId/special-days/:specialDayId', updateSpecialDay);
router.delete('/:contactId/special-days/:specialDayId', deleteSpecialDay);

module.exports = router;