const mongoose = require('mongoose');

const AttendanceLogSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  date: {
    type: Date,
    required: true, // Stores the date part (e.g. YYYY-MM-DD)
  },
  clockIn: {
    type: Date,
  },
  clockOut: {
    type: Date,
  },
  totalHours: {
    type: Number,
    default: 0,
  },
  overtime: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day'],
    default: 'present',
  },
  location: {
    type: String,
    trim: true,
  },
  device: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Ensure an employee has only one attendance log per calendar date
AttendanceLogSchema.index({ employeeId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('AttendanceLog', AttendanceLogSchema);
