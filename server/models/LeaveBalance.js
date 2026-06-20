const mongoose = require('mongoose');

const LeaveBalanceSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  leaveTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LeaveType',
    required: true,
  },
  year: {
    type: Number,
    required: true,
    default: () => new Date().getFullYear(),
  },
  allocated: {
    type: Number,
    required: true,
  },
  used: {
    type: Number,
    default: 0,
  },
  remaining: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true,
});

// Compound unique key
LeaveBalanceSchema.index({ employeeId: 1, leaveTypeId: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('LeaveBalance', LeaveBalanceSchema);
