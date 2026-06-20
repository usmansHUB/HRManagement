const express = require('express');
const performanceController = require('../controllers/performanceController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');

const router = express.Router();

router.use(protect);

// Goals OKR/KPI
router.get('/goals', performanceController.getGoals);
router.post('/goals', performanceController.createGoal);
router.put('/goals/:id', performanceController.updateGoal);
router.delete('/goals/:id', performanceController.deleteGoal);

// Cycles
router.get('/cycles', performanceController.getCycles);
router.post('/cycles', checkRole(['Super Admin', 'HR Manager']), performanceController.createCycle);

// Reviews & Feedback
router.get('/reviews', performanceController.getReviews);
router.post('/reviews', performanceController.submitReview);
router.get('/reviews/summary/:employeeId', performanceController.getReviewSummary);

module.exports = router;
