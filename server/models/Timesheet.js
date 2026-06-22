const mongoose = require('mongoose');

const TimesheetSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  entries: [{
    project: {
      type: String,
      required: true,
    },
    task: {
      type: String,
      required: true,
    },
    hours: [{
      type: Number,
      default: 0,
    }], // Array of 7 numbers representing Mon-Sun
  }],
  status: {
    type: String,
    enum: ['draft', 'submitted', 'approved', 'rejected'],
    default: 'draft',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Timesheet', TimesheetSchema);
