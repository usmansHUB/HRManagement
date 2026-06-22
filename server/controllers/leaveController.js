const LeaveType = require('../models/LeaveType');
const LeaveBalance = require('../models/LeaveBalance');
const LeaveRequest = require('../models/LeaveRequest');
const Employee = require('../models/Employee');
const { uploadFile } = require('../config/cloudinary');
const sendResponse = require('../utils/apiResponse');

// ==================== Leave Types CRUD (Admin / HR) ====================

exports.getLeaveTypes = async (req, res, next) => {
  try {
    let types = await LeaveType.find({});
    
    // Fail-safe: Dynamically seed default leave types if they don't exist in the database
    if (types.length === 0) {
      await LeaveType.create([
        { name: 'Annual Leave', defaultDays: 15, carryForward: true, isPaid: true },
        { name: 'Sick Leave', defaultDays: 10, carryForward: false, isPaid: true },
        { name: 'Casual Leave', defaultDays: 7, carryForward: false, isPaid: true },
        { name: 'Unpaid Leave', defaultDays: 30, carryForward: false, isPaid: false },
      ]);
      types = await LeaveType.find({});
    }

    return sendResponse(res, 200, true, 'Leave types retrieved successfully', types);
  } catch (error) {
    next(error);
  }
};

exports.createLeaveType = async (req, res, next) => {
  try {
    const { name, defaultDays, carryForward, isPaid, requiresDoc } = req.body;
    
    const exists = await LeaveType.findOne({ name });
    if (exists) {
      return sendResponse(res, 400, false, 'Leave type already exists');
    }

    const newType = new LeaveType({ name, defaultDays, carryForward, isPaid, requiresDoc });
    await newType.save();

    // Proactively generate balances for existing active employees for this new type
    const employees = await Employee.find({ status: 'active' });
    const currentYear = new Date().getFullYear();
    
    for (const emp of employees) {
      await LeaveBalance.create({
        employeeId: emp._id,
        leaveTypeId: newType._id,
        year: currentYear,
        allocated: defaultDays,
        remaining: defaultDays,
      }).catch(() => {}); // ignore duplicates
    }

    return sendResponse(res, 201, true, 'Leave type created successfully', newType);
  } catch (error) {
    next(error);
  }
};

exports.updateLeaveType = async (req, res, next) => {
  try {
    const { name, defaultDays, carryForward, isPaid, requiresDoc } = req.body;
    const type = await LeaveType.findById(req.params.id);
    
    if (!type) {
      return sendResponse(res, 404, false, 'Leave type not found');
    }

    type.name = name || type.name;
    type.defaultDays = defaultDays !== undefined ? defaultDays : type.defaultDays;
    type.carryForward = carryForward !== undefined ? carryForward : type.carryForward;
    type.isPaid = isPaid !== undefined ? isPaid : type.isPaid;
    type.requiresDoc = requiresDoc !== undefined ? requiresDoc : type.requiresDoc;

    await type.save();
    return sendResponse(res, 200, true, 'Leave type updated successfully', type);
  } catch (error) {
    next(error);
  }
};

exports.deleteLeaveType = async (req, res, next) => {
  try {
    const type = await LeaveType.findByIdAndDelete(req.params.id);
    if (!type) {
      return sendResponse(res, 404, false, 'Leave type not found');
    }
    return sendResponse(res, 200, true, 'Leave type deleted successfully');
  } catch (error) {
    next(error);
  }
};

// ==================== Leave Balances ====================

exports.getLeaveBalances = async (req, res, next) => {
  try {
    const employeeId = req.query.employeeId || req.user.employeeId;
    if (!employeeId) {
      return sendResponse(res, 400, false, 'Employee profile not associated with user');
    }

    const year = parseInt(req.query.year || new Date().getFullYear());

    // Verify access
    if (employeeId.toString() !== req.user.employeeId?.toString() && !['Super Admin', 'HR Manager', 'Department Manager'].includes(req.user.role)) {
      return sendResponse(res, 403, false, 'Forbidden: You cannot view balances of other employees');
    }

    let balances = await LeaveBalance.find({ employeeId, year }).populate('leaveTypeId');

    // If balances don't exist yet, seed them dynamically for this employee
    if (balances.length === 0) {
      const types = await LeaveType.find({});
      for (const t of types) {
        await LeaveBalance.create({
          employeeId,
          leaveTypeId: t._id,
          year,
          allocated: t.defaultDays,
          remaining: t.defaultDays,
        }).catch(() => {});
      }
      balances = await LeaveBalance.find({ employeeId, year }).populate('leaveTypeId');
    }

    return sendResponse(res, 200, true, 'Leave balances retrieved successfully', balances);
  } catch (error) {
    next(error);
  }
};

// ==================== Leave Requests ====================

exports.applyLeave = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId;
    if (!employeeId) {
      return sendResponse(res, 400, false, 'No Employee profile associated with this account');
    }

    const { leaveTypeId, startDate, endDate, reason, isHalfDay } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return sendResponse(res, 400, false, 'Start date must be before or equal to End date');
    }

    // Calculate total days
    let totalDays = 0;
    if (isHalfDay === 'true' || isHalfDay === true) {
      totalDays = 0.5;
    } else {
      const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
      const utcEnd = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
      totalDays = Math.round((utcEnd - utcStart) / (1000 * 60 * 60 * 24)) + 1;
    }

    // Check balance
    const currentYear = start.getFullYear();
    let balance = await LeaveBalance.findOne({ employeeId, leaveTypeId, year: currentYear });
    
    // Dynamically seed leave balances if they don't exist for this employee
    if (!balance) {
      const types = await LeaveType.find({});
      for (const t of types) {
        await LeaveBalance.create({
          employeeId,
          leaveTypeId: t._id,
          year: currentYear,
          allocated: t.defaultDays,
          remaining: t.defaultDays,
        }).catch(() => {});
      }
      balance = await LeaveBalance.findOne({ employeeId, leaveTypeId, year: currentYear });
    }

    if (!balance || balance.remaining < totalDays) {
      return sendResponse(res, 400, false, 'Insufficient leave balance for this request');
    }

    // File upload
    let attachmentUrl = '';
    if (req.file) {
      attachmentUrl = await uploadFile(req.file, 'leave_attachments');
    }

    const leaveRequest = new LeaveRequest({
      employeeId,
      leaveTypeId,
      startDate: start,
      endDate: end,
      totalDays,
      isHalfDay: isHalfDay === 'true' || isHalfDay === true,
      reason,
      attachmentUrl,
      status: 'pending',
    });

    await leaveRequest.save();

    const populatedRequest = await LeaveRequest.findById(leaveRequest._id)
      .populate('leaveTypeId', 'name')
      .populate('employeeId', 'firstName lastName employeeCode department designation');

    return sendResponse(res, 201, true, 'Leave requested successfully', populatedRequest);
  } catch (error) {
    next(error);
  }
};

exports.getLeaveRequests = async (req, res, next) => {
  try {
    const { status, employeeId } = req.query;
    const query = {};

    if (['Super Admin', 'HR Manager'].includes(req.user.role)) {
      if (employeeId) query.employeeId = employeeId;
    } else if (req.user.role === 'Department Manager') {
      // Show team members' leave requests + manager's own
      const teamEmployees = await Employee.find({ managerId: req.user.employeeId }).select('_id');
      const ids = teamEmployees.map(e => e._id);
      ids.push(req.user.employeeId);
      query.employeeId = { $in: ids };
    } else {
      // Regular employee
      query.employeeId = req.user.employeeId;
    }

    if (status) {
      query.status = status;
    }

    const requests = await LeaveRequest.find(query)
      .populate('employeeId', 'firstName lastName employeeCode department designation')
      .populate('leaveTypeId', 'name')
      .populate('approverId', 'firstName lastName')
      .sort({ appliedAt: -1 });

    return sendResponse(res, 200, true, 'Leave requests retrieved successfully', requests);
  } catch (error) {
    next(error);
  }
};

exports.resolveLeaveRequest = async (req, res, next) => {
  try {
    const { status, comment } = req.body; // approved or rejected
    
    if (!['approved', 'rejected'].includes(status)) {
      return sendResponse(res, 400, false, 'Status must be approved or rejected');
    }

    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) {
      return sendResponse(res, 404, false, 'Leave request not found');
    }

    if (leaveRequest.status !== 'pending') {
      return sendResponse(res, 400, false, 'Leave request has already been processed');
    }

    const approverEmployeeId = req.user.employeeId;
    if (!approverEmployeeId) {
      return sendResponse(res, 400, false, 'Only users with Employee profiles can approve leaves');
    }

    // Process approval
    if (status === 'approved') {
      const year = new Date(leaveRequest.startDate).getUTCFullYear();
      
      // Update LeaveBalance
      const balance = await LeaveBalance.findOne({
        employeeId: leaveRequest.employeeId,
        leaveTypeId: leaveRequest.leaveTypeId,
        year,
      });

      if (!balance || balance.remaining < leaveRequest.totalDays) {
        return sendResponse(res, 400, false, 'Cannot approve: Employee has insufficient leave balance');
      }

      balance.used += leaveRequest.totalDays;
      balance.remaining -= leaveRequest.totalDays;
      await balance.save();
    }

    leaveRequest.status = status;
    leaveRequest.approverId = approverEmployeeId;
    leaveRequest.approverComment = comment || '';
    leaveRequest.resolvedAt = new Date();
    
    await leaveRequest.save();
    return sendResponse(res, 200, true, `Leave request has been ${status} successfully`, leaveRequest);
  } catch (error) {
    next(error);
  }
};

// ==================== Calendars & Reports ====================

// GET /api/leave/team-calendar
exports.getTeamCalendar = async (req, res, next) => {
  try {
    // Return all approved leaves for the current week / month
    const start = new Date();
    start.setDate(start.getDate() - start.getDay()); // start of week (Sunday)
    
    const end = new Date(start);
    end.setDate(end.getDate() + 30); // next 30 days

    const leaves = await LeaveRequest.find({
      status: 'approved',
      startDate: { $lte: end },
      endDate: { $gte: start },
    })
      .populate('employeeId', 'firstName lastName employeeCode designation avatar')
      .populate('leaveTypeId', 'name');

    return sendResponse(res, 200, true, 'Team leaves calendar retrieved successfully', leaves);
  } catch (error) {
    next(error);
  }
};

// GET /api/leave/absenteeism-report
exports.getAbsenteeismReport = async (req, res, next) => {
  try {
    const activeCount = await Employee.countDocuments({ status: 'active' });
    
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Count employees currently on leave today
    const leavesToday = await LeaveRequest.find({
      status: 'approved',
      startDate: { $lte: today },
      endDate: { $gte: today },
    });

    const absentCount = leavesToday.length;
    const rate = activeCount > 0 ? Math.round((absentCount / activeCount) * 100) / 100 : 0;

    return sendResponse(res, 200, true, 'Absenteeism stats retrieved', {
      totalEmployees: activeCount,
      onLeaveToday: absentCount,
      absenteeismRate: rate * 100, // percentage
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/leave/balances/adjust
exports.adjustLeaveBalance = async (req, res, next) => {
  try {
    const { employeeId, leaveTypeId, allocated } = req.body;
    const year = new Date().getFullYear();

    let balance = await LeaveBalance.findOne({ employeeId, leaveTypeId, year });
    if (!balance) {
      balance = new LeaveBalance({
        employeeId,
        leaveTypeId,
        year,
        allocated,
        remaining: allocated,
        used: 0,
      });
    } else {
      const difference = allocated - balance.allocated;
      balance.allocated = allocated;
      balance.remaining = balance.remaining + difference;
    }

    await balance.save();
    const populated = await LeaveBalance.findById(balance._id).populate('leaveTypeId');

    return sendResponse(res, 200, true, 'Leave balance adjusted successfully', populated);
  } catch (error) {
    next(error);
  }
};
