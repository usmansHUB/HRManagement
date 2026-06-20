const express = require('express');
const lndController = require('../controllers/lndController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');

const router = express.Router();

router.use(protect);

// Courses
router.get('/courses', lndController.getCourses);
router.post('/courses', checkRole(['Super Admin', 'HR Manager']), lndController.createCourse);
router.put('/courses/:id', checkRole(['Super Admin', 'HR Manager']), lndController.updateCourse);
router.delete('/courses/:id', checkRole(['Super Admin', 'HR Manager']), lndController.deleteCourse);

// Assignments
router.get('/assignments', lndController.getAssignments);
router.post('/assignments', checkRole(['Super Admin', 'HR Manager']), lndController.assignCourse);
router.put('/assignments/:id/progress', lndController.updateProgress);

module.exports = router;
