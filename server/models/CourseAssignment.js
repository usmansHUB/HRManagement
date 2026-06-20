const mongoose = require('mongoose');

const CourseAssignmentSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed'],
    default: 'Not Started',
  },
  completedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Ensure course is assigned once per employee
CourseAssignmentSchema.index({ courseId: 1, employeeId: 1 }, { unique: true });

module.exports = mongoose.model('CourseAssignment', CourseAssignmentSchema);
