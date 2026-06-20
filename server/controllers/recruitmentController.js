const Job = require('../models/Job');
const Applicant = require('../models/Applicant');
const { uploadFile } = require('../config/cloudinary');
const sendResponse = require('../utils/apiResponse');

// ==================== Jobs Posting CRUD ====================

exports.getJobs = async (req, res, next) => {
  try {
    const { status, department } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (department) query.department = new RegExp(department, 'i');

    const jobs = await Job.find(query).sort({ postedAt: -1 });
    return sendResponse(res, 200, true, 'Jobs fetched successfully', jobs);
  } catch (error) {
    next(error);
  }
};

exports.createJob = async (req, res, next) => {
  try {
    const { title, department, type, description, requirements } = req.body;
    
    const job = new Job({
      title,
      department,
      type,
      description,
      requirements,
      createdBy: req.user._id,
    });

    await job.save();
    return sendResponse(res, 201, true, 'Job posting created successfully', job);
  } catch (error) {
    next(error);
  }
};

exports.updateJob = async (req, res, next) => {
  try {
    const { title, department, type, description, requirements, status } = req.body;
    const job = await Job.findById(req.params.id);

    if (!job) {
      return sendResponse(res, 404, false, 'Job posting not found');
    }

    job.title = title || job.title;
    job.department = department || job.department;
    job.type = type || job.type;
    job.description = description || job.description;
    job.requirements = requirements || job.requirements;
    job.status = status || job.status;

    await job.save();
    return sendResponse(res, 200, true, 'Job posting updated successfully', job);
  } catch (error) {
    next(error);
  }
};

exports.deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      return sendResponse(res, 404, false, 'Job posting not found');
    }
    // Delete applicants for this job as well
    await Applicant.deleteMany({ jobId: req.params.id });
    return sendResponse(res, 200, true, 'Job posting and associated applicants deleted successfully');
  } catch (error) {
    next(error);
  }
};

// ==================== Applicant Pipeline ATS ====================

exports.getApplicants = async (req, res, next) => {
  try {
    const { jobId, stage } = req.query;
    const query = {};

    if (jobId) query.jobId = jobId;
    if (stage) query.stage = stage;

    const applicants = await Applicant.find(query)
      .populate('jobId', 'title department')
      .sort({ appliedAt: -1 });

    return sendResponse(res, 200, true, 'Applicants fetched successfully', applicants);
  } catch (error) {
    next(error);
  }
};

// Public application endpoint (unauthenticated for applicants submitting resumes)
exports.applyForJob = async (req, res, next) => {
  try {
    const { jobId, name, email, phone } = req.body;

    if (!req.file) {
      return sendResponse(res, 400, false, 'Resume file is required');
    }

    const resumeUrl = await uploadFile(req.file, 'resumes');

    const applicant = new Applicant({
      jobId,
      name,
      email,
      phone,
      resumeUrl,
      stage: 'Applied',
    });

    await applicant.save();
    return sendResponse(res, 201, true, 'Application submitted successfully', applicant);
  } catch (error) {
    next(error);
  }
};

// PUT /api/recruitment/applicants/:id/stage (Drag & drop stage change)
exports.updateApplicantStage = async (req, res, next) => {
  try {
    const { stage } = req.body;
    const validStages = ['Applied', 'Screened', 'Interview', 'Offer', 'Hired', 'Rejected'];
    
    if (!validStages.includes(stage)) {
      return sendResponse(res, 400, false, 'Invalid pipeline stage');
    }

    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) {
      return sendResponse(res, 404, false, 'Applicant not found');
    }

    applicant.stage = stage;
    await applicant.save();

    return sendResponse(res, 200, true, `Applicant stage updated to ${stage}`, applicant);
  } catch (error) {
    next(error);
  }
};

// POST /api/recruitment/applicants/:id/notes (Add interview notes)
exports.addApplicantNote = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) {
      return sendResponse(res, 400, false, 'Note text cannot be empty');
    }

    const applicant = await Applicant.findById(req.params.id);
    if (!applicant) {
      return sendResponse(res, 404, false, 'Applicant not found');
    }

    applicant.notes.push({
      author: req.user.name,
      text,
      createdAt: new Date(),
    });

    await applicant.save();
    return sendResponse(res, 200, true, 'Interview note added successfully', applicant);
  } catch (error) {
    next(error);
  }
};
