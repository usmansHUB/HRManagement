const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  headId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  },
  parentDept: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Department', DepartmentSchema);
