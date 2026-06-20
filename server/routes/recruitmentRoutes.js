const express = require('express');
const recruitmentController = require('../controllers/recruitmentController');
const { protect } = require('../middleware/auth');
const { checkRole } = require('../middleware/roles');
const { upload } = require('../config/cloudinary');

const router = express.Router();

// Public routes for job postings list and applying
router.get('/jobs', recruitmentController.getJobs);
router.post('/apply', upload.single('resume'), recruitmentController.applyForJob);

// Protected routes (Super Admin, HR Manager)
router.use(protect);
router.use(checkRole(['Super Admin', 'HR Manager']));

router.post('/jobs', recruitmentController.createJob);
router.put('/jobs/:id', recruitmentController.updateJob);
router.delete('/jobs/:id', recruitmentController.deleteJob);

router.get('/applicants', recruitmentController.getApplicants);
router.put('/applicants/:id/stage', recruitmentController.updateApplicantStage);
router.post('/applicants/:id/notes', recruitmentController.addApplicantNote);

module.exports = router;
