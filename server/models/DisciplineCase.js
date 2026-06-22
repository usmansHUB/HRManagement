const mongoose = require('mongoose');

const DisciplineCaseSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  actionTaken: {
    type: String,
    default: '',
  },
  status: {
    type: String,
    enum: ['active', 'resolved'],
    default: 'active',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('DisciplineCase', DisciplineCaseSchema);
