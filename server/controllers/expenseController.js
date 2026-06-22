const Expense = require('../models/Expense');
const sendResponse = require('../utils/apiResponse');

// GET /api/expenses - Get all or own expenses
exports.getExpenses = async (req, res, next) => {
  try {
    const query = {};
    const isHrOrAdmin = ['Super Admin', 'HR Manager'].includes(req.user.role);

    if (!isHrOrAdmin) {
      if (!req.user.employeeId) {
        return sendResponse(res, 400, false, 'No employee record associated with this user');
      }
      query.employeeId = req.user.employeeId;
    }

    const expenses = await Expense.find(query)
      .populate('employeeId', 'firstName lastName employeeCode designation department avatar')
      .populate('approvedBy', 'firstName lastName employeeCode designation')
      .sort({ createdAt: -1 });

    return sendResponse(res, 200, true, 'Expense claims fetched successfully', expenses);
  } catch (error) {
    next(error);
  }
};

// POST /api/expenses - Submit a new claim
exports.createExpense = async (req, res, next) => {
  try {
    const { title, category, amount, description } = req.body;

    if (!title || !category || !amount) {
      return sendResponse(res, 400, false, 'Title, Category, and Amount are required fields');
    }

    if (!req.user.employeeId) {
      return sendResponse(res, 400, false, 'Only personnel/employees can log expense claims');
    }

    const expense = new Expense({
      employeeId: req.user.employeeId,
      title,
      category,
      amount: parseFloat(amount),
      description,
      status: 'pending',
    });

    await expense.save();
    return sendResponse(res, 201, true, 'Expense claim submitted successfully', expense);
  } catch (error) {
    next(error);
  }
};

// PUT /api/expenses/:id/approve - Approve or reject claim
exports.resolveExpense = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return sendResponse(res, 400, false, 'Invalid status choice. Must be approved or rejected');
    }

    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return sendResponse(res, 404, false, 'Expense claim not found');
    }

    if (expense.status !== 'pending') {
      return sendResponse(res, 400, false, 'This expense claim has already been resolved and cannot be changed');
    }

    expense.status = status;
    expense.approvedBy = req.user.employeeId || null;
    expense.processedAt = new Date();

    await expense.save();
    return sendResponse(res, 200, true, `Expense claim ${status} successfully`, expense);
  } catch (error) {
    next(error);
  }
};
