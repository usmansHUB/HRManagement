const express = require('express');
const payrollController = require('../controllers/payrollController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');

const router = express.Router();

router.use(protect);

router.get('/run', checkRole(['Super Admin', 'HR Manager']), payrollController.getPayrollDraft);
router.post('/run', checkRole(['Super Admin', 'HR Manager']), payrollController.processPayroll);
router.get('/history', payrollController.getPayrollHistory);
router.get('/payslip/:id', payrollController.downloadPayslip);

module.exports = router;
