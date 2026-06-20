const mongoose = require('mongoose');

const LeaveTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true, // e.g. "Annual Leave", "Sick Leave"
  },
  defaultDays: {
    type: Number,
    required: true,
    default: 15,
  },
  carryForward: {
    type: Boolean,
    default: false,
  },
  isPaid: {
    type: Boolean,
    default: true,
  },
  requiresDoc: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('LeaveType', LeaveTypeSchema);
