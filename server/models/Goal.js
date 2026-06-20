const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  cycleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ReviewCycle',
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
  },
  type: {
    type: String,
    enum: ['OKR', 'KPI'],
    default: 'OKR',
  },
  targetValue: {
    type: Number,
    required: true,
    default: 100,
  },
  currentValue: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Achieved', 'Missed'],
    default: 'Not Started',
  },
  dueDate: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Goal', GoalSchema);
