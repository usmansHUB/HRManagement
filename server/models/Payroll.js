const mongoose = require('mongoose');

const PayrollSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  month: {
    type: Number,
    required: true,
  },
  year: {
    type: Number,
    required: true,
  },
  basicSalary: {
    type: Number,
    required: true,
  },
  allowances: [{
    name: String,
    amount: Number,
  }],
  deductions: [{
    name: String,
    amount: Number,
  }],
  taxAmount: {
    type: Number,
    default: 0,
  },
  netPay: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'processed', 'paid'],
    default: 'draft',
  },
  payslipUrl: {
    type: String,
    default: '',
  },
  processedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Avoid double payroll logs for same month/year per employee
PayrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', PayrollSchema);
