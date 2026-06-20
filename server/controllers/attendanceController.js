const AttendanceLog = require('../models/AttendanceLog');
const Employee = require('../models/Employee');
const sendResponse = require('../utils/apiResponse');

// Helper to get local date string (YYYY-MM-DD)
const getLocalDateString = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// POST /api/attendance/clock-in
exports.clockIn = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return sendResponse(res, 400, false, 'No Employee profile associated with this account');
    }

    const now = new Date();
    const todayStr = getLocalDateString(now);
    const todayDate = new Date(todayStr); // local midnight date

    // Check if already clocked in today
    let log = await AttendanceLog.findOne({ employeeId, date: todayDate });
    if (log && log.clockIn) {
      return sendResponse(res, 400, false, 'Already clocked in for today');
    }

    // Determine status (Late if clocked in after 9:15 AM)
    const cutoffTime = new Date(now);
    cutoffTime.setHours(9, 15, 0, 0); // 09:15 AM
    const status = now > cutoffTime ? 'late' : 'present';

    if (!log) {
      log = new AttendanceLog({
        employeeId,
        date: todayDate,
        clockIn: now,
        status,
        location: req.body.location || 'Remote',
        device: req.body.device || 'Web Browser',
      });
    } else {
      log.clockIn = now;
      log.status = status;
    }

    await log.save();
    return sendResponse(res, 200, true, 'Clocked in successfully', log);
  } catch (error) {
    next(error);
  }
};

// POST /api/attendance/clock-out
exports.clockOut = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return sendResponse(res, 400, false, 'No Employee profile associated with this account');
    }

    const now = new Date();
    const todayStr = getLocalDateString(now);
    const todayDate = new Date(todayStr);

    const log = await AttendanceLog.findOne({ employeeId, date: todayDate });
    if (!log || !log.clockIn) {
      return sendResponse(res, 400, false, 'You must clock in before clocking out');
    }

    if (log.clockOut) {
      return sendResponse(res, 400, false, 'Already clocked out for today');
    }

    log.clockOut = now;
    
    // Calculate total hours
    const diffMs = log.clockOut - log.clockIn;
    const diffHours = diffMs / (1000 * 60 * 60);
    log.totalHours = Math.round(diffHours * 100) / 100;

    // Overtime if total hours > 8
    if (log.totalHours > 8) {
      log.overtime = Math.round((log.totalHours - 8) * 100) / 100;
    }

    await log.save();
    return sendResponse(res, 200, true, 'Clocked out successfully', log);
  } catch (error) {
    next(error);
  }
};

// GET /api/attendance/logs
exports.getLogs = async (req, res, next) => {
  try {
    const { employeeId, startDate, endDate } = req.query;

    const query = {};

    // Filter by employeeId: managers/HR can see others, employees only see themselves
    if (['Super Admin', 'HR Manager', 'Department Manager'].includes(req.user.role)) {
      if (employeeId) {
        query.employeeId = employeeId;
      }
    } else {
      query.employeeId = req.user.employeeId;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const logs = await AttendanceLog.find(query)
      .populate('employeeId', 'firstName lastName employeeCode')
      .sort({ date: -1 });

    return sendResponse(res, 200, true, 'Attendance logs retrieved successfully', logs);
  } catch (error) {
    next(error);
  }
};

// GET /api/attendance/monthly-summary
exports.getMonthlySummary = async (req, res, next) => {
  try {
    const employeeId = req.query.employeeId || req.user.employeeId;
    const year = parseInt(req.query.year || new Date().getFullYear());
    const month = parseInt(req.query.month || new Date().getMonth() + 1); // 1-12

    const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
    const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const logs = await AttendanceLog.find({
      employeeId,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const summary = {
      present: 0,
      late: 0,
      absent: 0,
      halfDay: 0,
      totalHours: 0,
      overtime: 0,
    };

    logs.forEach(log => {
      if (log.status === 'present') summary.present++;
      else if (log.status === 'late') summary.late++;
      else if (log.status === 'absent') summary.absent++;
      else if (log.status === 'half-day') summary.halfDay++;

      summary.totalHours += log.totalHours;
      summary.overtime += log.overtime;
    });

    summary.totalHours = Math.round(summary.totalHours * 100) / 100;
    summary.overtime = Math.round(summary.overtime * 100) / 100;

    return sendResponse(res, 200, true, 'Monthly summary retrieved successfully', { logs, summary });
  } catch (error) {
    next(error);
  }
};
