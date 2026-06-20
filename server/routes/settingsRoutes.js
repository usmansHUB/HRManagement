const express = require('express');
const settingsController = require('../controllers/settingsController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');
const { upload } = require('../config/cloudinary');

const router = express.Router();

router.use(protect);

// Company Settings
router.get('/company', settingsController.getCompanySettings);
router.put('/company', checkRole(['Super Admin']), upload.single('logo'), settingsController.updateCompanySettings);

// Departments CRUD
router.get('/departments', settingsController.getDepartments);
router.post('/departments', checkRole(['Super Admin', 'HR Manager']), settingsController.createDepartment);
router.put('/departments/:id', checkRole(['Super Admin', 'HR Manager']), settingsController.updateDepartment);
router.delete('/departments/:id', checkRole(['Super Admin', 'HR Manager']), settingsController.deleteDepartment);

module.exports = router;
