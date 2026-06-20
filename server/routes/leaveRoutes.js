const express = require('express');
const leaveController = require('../controllers/leaveController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');
const { upload } = require('../config/cloudinary');

const router = express.Router();

router.use(protect);

// Leave Types CRUD
router.get('/types', leaveController.getLeaveTypes);
router.post('/types', checkRole(['Super Admin', 'HR Manager']), leaveController.createLeaveType);
router.put('/types/:id', checkRole(['Super Admin', 'HR Manager']), leaveController.updateLeaveType);
router.delete('/types/:id', checkRole(['Super Admin', 'HR Manager']), leaveController.deleteLeaveType);

// Balances
router.get('/balances', leaveController.getLeaveBalances);

// Requests CRUD and Actions
router.get('/requests', leaveController.getLeaveRequests);
router.post('/requests', upload.single('attachment'), leaveController.applyLeave);
router.put('/requests/:id/approve', checkRole(['Super Admin', 'HR Manager', 'Department Manager']), leaveController.resolveLeaveRequest);

// Calendar & Reports
router.get('/team-calendar', leaveController.getTeamCalendar);
router.get('/absenteeism-report', checkRole(['Super Admin', 'HR Manager', 'Department Manager']), leaveController.getAbsenteeismReport);

module.exports = router;
