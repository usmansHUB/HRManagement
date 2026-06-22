const express = require('express');
const expenseController = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');

const router = express.Router();

router.use(protect);

router.get('/', expenseController.getExpenses);
router.post('/', expenseController.createExpense);
router.put('/:id/approve', checkRole(['Super Admin', 'HR Manager']), expenseController.resolveExpense);

module.exports = router;
