const mongoose = require('mongoose');

const CompanySettingsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: 'HRM Corp',
  },
  logo: {
    type: String,
    default: '',
  },
  timezone: {
    type: String,
    default: 'UTC',
  },
  currency: {
    type: String,
    default: 'USD',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('CompanySettings', CompanySettingsSchema);
