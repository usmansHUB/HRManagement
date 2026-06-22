const Timesheet = require('../models/Timesheet');
const sendResponse = require('../utils/apiResponse');

// GET /api/timesheets - Fetch timesheets
exports.getTimesheets = async (req, res, next) => {
  try {
    const { status, startDate } = req.query;
    const query = {};

    const isManagerOrAdmin = ['Super Admin', 'HR Manager', 'Department Manager'].includes(req.user.role);

    if (!isManagerOrAdmin) {
      if (!req.user.employeeId) {
        return sendResponse(res, 400, false, 'No employee record associated with this user');
      }
      query.employeeId = req.user.employeeId;
    }

    if (status) query.status = status;
    if (startDate) query.startDate = new Date(startDate);

    const timesheets = await Timesheet.find(query)
      .populate('employeeId', 'firstName lastName employeeCode designation department avatar')
      .populate('approvedBy', 'firstName lastName employeeCode designation')
      .sort({ startDate: -1 });

    return sendResponse(res, 200, true, 'Timesheets fetched successfully', timesheets);
  } catch (error) {
    next(error);
  }
};

// POST /api/timesheets - Save draft or submit timesheet
exports.saveTimesheet = async (req, res, next) => {
  try {
    const { startDate, endDate, entries, status } = req.body;

    if (!startDate || !endDate || !entries || !Array.isArray(entries)) {
      return sendResponse(res, 400, false, 'Start date, end date, and timesheet entries are required');
    }

    if (!req.user.employeeId) {
      return sendResponse(res, 400, false, 'Only employee profiles can create timesheets');
    }

    const tStatus = status || 'draft';
    if (!['draft', 'submitted'].includes(tStatus)) {
      return sendResponse(res, 400, false, 'Invalid timesheet submit status');
    }

    const start = new Date(startDate);
    start.setUTCHours(0, 0, 0, 0);

    // Look for existing timesheet for this week
    let timesheet = await Timesheet.findOne({
      employeeId: req.user.employeeId,
      startDate: start,
    });

    if (timesheet && ['approved', 'submitted'].includes(timesheet.status) && tStatus === 'draft') {
      return sendResponse(res, 400, false, 'Timesheet has already been submitted or approved for this period');
    }

    if (timesheet && timesheet.status === 'approved') {
      return sendResponse(res, 400, false, 'Approved timesheets cannot be modified');
    }

    if (!timesheet) {
      timesheet = new Timesheet({
        employeeId: req.user.employeeId,
        startDate: start,
        endDate: new Date(endDate),
      });
    }

    // Process entries and validate hours
    timesheet.entries = entries.map(entry => {
      const hours = Array.isArray(entry.hours) ? entry.hours : [0,0,0,0,0,0,0];
      // Pad or slice to exactly 7 days
      while (hours.length < 7) hours.push(0);
      return {
        project: entry.project,
        task: entry.task,
        hours: hours.slice(0, 7).map(h => parseFloat(h) || 0),
      };
    });

    timesheet.status = tStatus;
    await timesheet.save();

    return sendResponse(res, 200, true, `Timesheet ${tStatus === 'draft' ? 'saved as draft' : 'submitted'} successfully`, timesheet);
  } catch (error) {
    next(error);
  }
};

// PUT /api/timesheets/:id/approve - Approve or reject timesheet
exports.resolveTimesheet = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return sendResponse(res, 400, false, 'Status must be approved or rejected');
    }

    const timesheet = await Timesheet.findById(req.params.id);
    if (!timesheet) {
      return sendResponse(res, 404, false, 'Timesheet not found');
    }

    if (timesheet.status !== 'submitted') {
      return sendResponse(res, 400, false, 'Only submitted timesheets can be resolved');
    }

    timesheet.status = status;
    timesheet.approvedBy = req.user.employeeId || null;

    await timesheet.save();
    return sendResponse(res, 200, true, `Timesheet has been ${status}`, timesheet);
  } catch (error) {
    next(error);
  }
};
