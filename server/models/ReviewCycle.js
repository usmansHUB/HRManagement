const mongoose = require('mongoose');

const ReviewCycleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true, // e.g. "Q3 Performance Review 2026"
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('ReviewCycle', ReviewCycleSchema);
