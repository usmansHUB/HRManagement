const express = require('express');
const disciplineController = require('../controllers/disciplineController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');

const router = express.Router();

router.use(protect);

router.get('/', disciplineController.getCases);
router.post('/', checkRole(['Super Admin', 'HR Manager']), disciplineController.createCase);
router.put('/:id/resolve', checkRole(['Super Admin', 'HR Manager']), disciplineController.resolveCase);

module.exports = router;
