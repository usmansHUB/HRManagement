const express = require('express');
const attendanceController = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/clock-in', attendanceController.clockIn);
router.post('/clock-out', attendanceController.clockOut);
router.get('/logs', attendanceController.getLogs);
router.get('/monthly-summary', attendanceController.getMonthlySummary);

module.exports = router;
