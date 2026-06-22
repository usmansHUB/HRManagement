const mongoose = require('mongoose');

const BuzzPostSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('BuzzPost', BuzzPostSchema);
