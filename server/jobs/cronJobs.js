const cron = require('node-cron');
const Employee = require('../models/Employee');
const LeaveRequest = require('../models/LeaveRequest');
const transporter = require('../config/nodemailer');

const initCronJobs = () => {
  console.log('Cron Job Scheduler Initialized.');

  // Run at 09:00 AM every day
  cron.schedule('0 9 * * *', async () => {
    console.log('Running daily cron job for HR alerts...');
    try {
      // 1. Contract Expiry Alerts (e.g., contracts ending within 30 days)
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 30);
      
      const expiringContracts = await Employee.find({
        employmentType: 'Contract',
        status: 'active',
        // Check employees whose contracts expire soon (we can mock this check using their joining date if contract length is fixed)
      });

      console.log(`[Cron] Found ${expiringContracts.length} contract employees to monitor.`);

      // 2. Pending Leaves Reminder
      const pendingLeaves = await LeaveRequest.find({ status: 'pending' })
        .populate('employeeId', 'firstName lastName');

      if (pendingLeaves.length > 0) {
        console.log(`[Cron] Alert: There are ${pendingLeaves.length} pending leave requests requiring approval.`);
        
        // Log alerts to console (or email HR manager if credentials configured)
        pendingLeaves.forEach(req => {
          console.log(`  - Leave Request pending for: ${req.employeeId.firstName} ${req.employeeId.lastName} since ${req.appliedAt.toLocaleDateString()}`);
        });
      }
    } catch (err) {
      console.error('Error running daily cron job:', err);
    }
  });

  // Keep-alive check every hour
  cron.schedule('0 * * * *', () => {
    console.log('[Cron] Hour check: HRM cron service is healthy.');
  });
};

module.exports = initCronJobs;
