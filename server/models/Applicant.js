const mongoose = require('mongoose');

const ApplicantSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  resumeUrl: {
    type: String,
    required: true,
  },
  stage: {
    type: String,
    enum: ['Applied', 'Screened', 'Interview', 'Offer', 'Hired', 'Rejected'],
    default: 'Applied',
  },
  notes: [{
    author: String,
    text: String,
    createdAt: {
      type: Date,
      default: Date.now,
    }
  }],
  appliedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Applicant', ApplicantSchema);
