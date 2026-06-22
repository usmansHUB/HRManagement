const DisciplineCase = require('../models/DisciplineCase');
const sendResponse = require('../utils/apiResponse');

// GET /api/discipline - Get all or own disciplinary cases
exports.getCases = async (req, res, next) => {
  try {
    const query = {};
    const isHrOrAdmin = ['Super Admin', 'HR Manager'].includes(req.user.role);

    if (!isHrOrAdmin) {
      if (!req.user.employeeId) {
        return sendResponse(res, 400, false, 'No employee record associated with this user');
      }
      query.employeeId = req.user.employeeId;
    }

    const cases = await DisciplineCase.find(query)
      .populate('employeeId', 'firstName lastName employeeCode designation department avatar')
      .sort({ createdAt: -1 });

    return sendResponse(res, 200, true, 'Disciplinary cases fetched successfully', cases);
  } catch (error) {
    next(error);
  }
};

// POST /api/discipline - Create new disciplinary case (Admin/HR only)
exports.createCase = async (req, res, next) => {
  try {
    const { employeeId, title, description, actionTaken } = req.body;

    if (!employeeId || !title || !description) {
      return sendResponse(res, 400, false, 'Employee ID, Title, and Description are required fields');
    }

    const newCase = new DisciplineCase({
      employeeId,
      title,
      description,
      actionTaken: actionTaken || '',
      status: 'active',
    });

    await newCase.save();
    
    const populated = await DisciplineCase.findById(newCase._id).populate('employeeId', 'firstName lastName employeeCode designation department avatar');
    return sendResponse(res, 201, true, 'Disciplinary case created successfully', populated);
  } catch (error) {
    next(error);
  }
};

// PUT /api/discipline/:id/resolve - Resolve disciplinary case (Admin/HR only)
exports.resolveCase = async (req, res, next) => {
  try {
    const { actionTaken, status } = req.body;
    
    if (status && !['active', 'resolved'].includes(status)) {
      return sendResponse(res, 400, false, 'Invalid status choice');
    }

    const disciplineCase = await DisciplineCase.findById(req.params.id);
    if (!disciplineCase) {
      return sendResponse(res, 404, false, 'Disciplinary case not found');
    }

    disciplineCase.actionTaken = actionTaken !== undefined ? actionTaken : disciplineCase.actionTaken;
    if (status) {
      disciplineCase.status = status;
    }

    await disciplineCase.save();
    return sendResponse(res, 200, true, 'Disciplinary case resolved/updated successfully', disciplineCase);
  } catch (error) {
    next(error);
  }
};
