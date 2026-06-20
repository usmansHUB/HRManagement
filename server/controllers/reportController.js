const Employee = require('../models/Employee');
const AttendanceLog = require('../models/AttendanceLog');
const LeaveRequest = require('../models/LeaveRequest');
const Payroll = require('../models/Payroll');
const sendResponse = require('../utils/apiResponse');

// GET /api/reports/headcount
exports.getHeadcountTrend = async (req, res, next) => {
  try {
    // Generate trend metrics for the last 12 months
    const trend = [];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth(); // 0-11
      const endOfMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

      // Count active employees that joined before or during this month
      const count = await Employee.countDocuments({
        joiningDate: { $lte: endOfMonth },
        status: { $in: ['active', 'inactive'] } // exclude terminated at this timestamp
      });

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      trend.push({
        label: `${monthNames[month]} ${year}`,
        count,
      });
    }

    return sendResponse(res, 200, true, 'Headcount trend generated successfully', trend);
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/absenteeism
exports.getAbsenteeismStats = async (req, res, next) => {
  try {
    // Returns general metrics for absenteeism
    const totalEmployees = await Employee.countDocuments({ status: 'active' });
    
    // Average leaves in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setUTCHours(0, 0, 0, 0);
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);

    const leaves = await LeaveRequest.find({
      status: 'approved',
      startDate: { $gte: thirtyDaysAgo }
    });

    const totalDaysRequested = leaves.reduce((sum, l) => sum + l.totalDays, 0);

    return sendResponse(res, 200, true, 'Absenteeism statistics retrieved', {
      totalEmployees,
      approvedLeavesLast30Days: leaves.length,
      totalLeaveDaysSpent: totalDaysRequested,
      averageLeaveDaysPerEmployee: totalEmployees > 0 ? (totalDaysRequested / totalEmployees).toFixed(2) : 0,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/payroll-summary
exports.getPayrollSummary = async (req, res, next) => {
  try {
    // Return aggregate payroll costs grouped by month/year
    const summary = await Payroll.aggregate([
      {
        $group: {
          _id: { month: '$month', year: '$year' },
          totalBasicSalary: { $sum: '$basicSalary' },
          totalTaxAmount: { $sum: '$taxAmount' },
          totalNetPay: { $sum: '$netPay' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      }
    ]);

    const formatted = summary.map(item => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return {
        label: `${monthNames[item._id.month - 1]} ${item._id.year}`,
        totalBasicSalary: item.totalBasicSalary,
        totalTaxAmount: item.totalTaxAmount,
        totalNetPay: item.totalNetPay,
        employeeCount: item.count,
      };
    });

    return sendResponse(res, 200, true, 'Payroll cost summary generated successfully', formatted);
  } catch (error) {
    next(error);
  }
};
