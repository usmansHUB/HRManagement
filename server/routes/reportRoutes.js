const express = require('express');
const reportController = require('../controllers/reportController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');

const router = express.Router();

router.use(protect);

router.get('/headcount', checkRole(['Super Admin', 'HR Manager', 'Department Manager']), reportController.getHeadcountTrend);
router.get('/absenteeism', checkRole(['Super Admin', 'HR Manager', 'Department Manager']), reportController.getAbsenteeismStats);
router.get('/payroll-summary', checkRole(['Super Admin', 'HR Manager']), reportController.getPayrollSummary);

module.exports = router;
