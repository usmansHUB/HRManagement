const express = require('express');
const timesheetController = require('../controllers/timesheetController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');

const router = express.Router();

router.use(protect);

router.get('/', timesheetController.getTimesheets);
router.post('/', timesheetController.saveTimesheet);
router.put('/:id/approve', checkRole(['Super Admin', 'HR Manager', 'Department Manager']), timesheetController.resolveTimesheet);

module.exports = router;
