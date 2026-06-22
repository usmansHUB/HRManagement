const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  employeeCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  avatar: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    trim: true,
  },
  dob: {
    type: Date,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
  },
  address: {
    type: String,
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
  },
  designation: {
    type: String,
    required: true,
  },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  },
  joiningDate: {
    type: Date,
    default: Date.now,
  },
  employmentType: {
    type: String,
    enum: ['Full-Time', 'Part-Time', 'Contract', 'Intern'],
    default: 'Full-Time',
  },
  salaryBand: {
    type: String,
    required: true, // e.g. "Band A", "Band B"
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'terminated'],
    default: 'active',
  },
  documents: [{
    name: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now,
    }
  }],
  emergencyContacts: [{
    name: String,
    relationship: String,
    phone: String,
  }],
  dependents: [{
    name: String,
    relationship: String,
    dob: Date,
  }],
}, {
  timestamps: true,
});

// Indexes
EmployeeSchema.index({ userId: 1 });

module.exports = mongoose.model('Employee', EmployeeSchema);
