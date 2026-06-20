const express = require('express');
const employeeController = require('../controllers/employeeController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');
const { upload } = require('../config/cloudinary');

const router = express.Router();

router.use(protect);

router.get(
  '/',
  checkRole(['Super Admin', 'HR Manager', 'Department Manager']),
  employeeController.getEmployees
);

router.get('/org-chart', employeeController.getOrgChart);

router.get(
  '/export/csv',
  checkRole(['Super Admin', 'HR Manager']),
  employeeController.exportCsv
);

router.get('/:id', employeeController.getEmployeeById);

router.post(
  '/',
  checkRole(['Super Admin', 'HR Manager']),
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'documents', maxCount: 5 },
  ]),
  employeeController.createEmployee
);

router.put(
  '/:id',
  upload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'documents', maxCount: 5 },
  ]),
  employeeController.updateEmployee
);

router.delete(
  '/:id',
  checkRole(['Super Admin', 'HR Manager']),
  employeeController.deleteEmployee
);

router.post(
  '/bulk-import',
  checkRole(['Super Admin', 'HR Manager']),
  upload.single('file'),
  employeeController.bulkImport
);

module.exports = router;
