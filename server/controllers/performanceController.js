const Goal = require('../models/Goal');
const ReviewCycle = require('../models/ReviewCycle');
const Review = require('../models/Review');
const Employee = require('../models/Employee');
const sendResponse = require('../utils/apiResponse');

// ==================== OKR / KPI Goals CRUD ====================

exports.getGoals = async (req, res, next) => {
  try {
    const { employeeId, cycleId } = req.query;
    const query = {};

    if (employeeId) {
      if (employeeId.toString() !== req.user.employeeId?.toString() && !['Super Admin', 'HR Manager', 'Department Manager'].includes(req.user.role)) {
        return sendResponse(res, 403, false, 'Forbidden: You cannot view goals of other employees');
      }
      query.employeeId = employeeId;
    } else if (req.user.role === 'Employee') {
      // Employees only view their own goals
      query.employeeId = req.user.employeeId;
    }

    if (cycleId) {
      query.cycleId = cycleId;
    }

    const goals = await Goal.find(query)
      .populate('employeeId', 'firstName lastName employeeCode')
      .populate('cycleId', 'name');

    return sendResponse(res, 200, true, 'Goals fetched successfully', goals);
  } catch (error) {
    next(error);
  }
};

exports.createGoal = async (req, res, next) => {
  try {
    const { employeeId, cycleId, title, description, type, targetValue, dueDate } = req.body;

    const targetEmpId = employeeId || req.user.employeeId;
    if (!targetEmpId) {
      return sendResponse(res, 400, false, 'Employee profile required to set goals');
    }

    const goal = new Goal({
      employeeId: targetEmpId,
      cycleId: cycleId || null,
      title,
      description,
      type,
      targetValue,
      dueDate,
    });

    await goal.save();
    return sendResponse(res, 201, true, 'Goal created successfully', goal);
  } catch (error) {
    next(error);
  }
};

exports.updateGoal = async (req, res, next) => {
  try {
    const { title, description, targetValue, currentValue, status } = req.body;
    const goal = await Goal.findById(req.params.id);

    if (!goal) {
      return sendResponse(res, 404, false, 'Goal not found');
    }

    // Permissions: Employee self or Manager/HR
    const isSelf = req.user.employeeId && req.user.employeeId.toString() === goal.employeeId.toString();
    const isManagerOrAdmin = ['Super Admin', 'HR Manager', 'Department Manager'].includes(req.user.role);

    if (!isSelf && !isManagerOrAdmin) {
      return sendResponse(res, 403, false, 'Forbidden: You cannot modify this goal');
    }

    goal.title = title || goal.title;
    goal.description = description || goal.description;
    goal.targetValue = targetValue !== undefined ? targetValue : goal.targetValue;
    goal.currentValue = currentValue !== undefined ? currentValue : goal.currentValue;
    goal.status = status || goal.status;

    // Automatically set status to Achieved if progress reaches target
    if (goal.currentValue >= goal.targetValue) {
      goal.status = 'Achieved';
    }

    await goal.save();
    return sendResponse(res, 200, true, 'Goal updated successfully', goal);
  } catch (error) {
    next(error);
  }
};

exports.deleteGoal = async (req, res, next) => {
  try {
    const goal = await Goal.findById(req.params.id);
    if (!goal) {
      return sendResponse(res, 404, false, 'Goal not found');
    }

    const isSelf = req.user.employeeId && req.user.employeeId.toString() === goal.employeeId.toString();
    const isHrOrAdmin = ['Super Admin', 'HR Manager'].includes(req.user.role);

    if (!isSelf && !isHrOrAdmin) {
      return sendResponse(res, 403, false, 'Forbidden: You cannot delete this goal');
    }

    await Goal.findByIdAndDelete(req.params.id);
    return sendResponse(res, 200, true, 'Goal deleted successfully');
  } catch (error) {
    next(error);
  }
};

// ==================== Review Cycles (HR / Admin) ====================

exports.getCycles = async (req, res, next) => {
  try {
    const cycles = await ReviewCycle.find({}).sort({ startDate: -1 });
    return sendResponse(res, 200, true, 'Review cycles fetched successfully', cycles);
  } catch (error) {
    next(error);
  }
};

exports.createCycle = async (req, res, next) => {
  try {
    const { name, startDate, endDate } = req.body;
    const cycle = new ReviewCycle({
      name,
      startDate,
      endDate,
      createdBy: req.user._id,
    });
    await cycle.save();
    return sendResponse(res, 201, true, 'Review cycle created successfully', cycle);
  } catch (error) {
    next(error);
  }
};

// ==================== Reviews (360 Degree Feedback) ====================

exports.getReviews = async (req, res, next) => {
  try {
    const { cycleId, revieweeId } = req.query;
    const query = {};

    if (cycleId) query.cycleId = cycleId;
    
    if (revieweeId) {
      if (revieweeId.toString() !== req.user.employeeId?.toString() && !['Super Admin', 'HR Manager', 'Department Manager'].includes(req.user.role)) {
        return sendResponse(res, 403, false, 'Forbidden: You cannot view performance reviews of other employees');
      }
      query.revieweeId = revieweeId;
    } else if (req.user.role === 'Employee') {
      // Employees only view self reviews
      query.revieweeId = req.user.employeeId;
    }

    const reviews = await Review.find(query)
      .populate('cycleId', 'name')
      .populate('revieweeId', 'firstName lastName designation employeeCode')
      .populate('reviewerId', 'firstName lastName designation employeeCode')
      .sort({ submittedAt: -1 });

    return sendResponse(res, 200, true, 'Reviews fetched successfully', reviews);
  } catch (error) {
    next(error);
  }
};

exports.submitReview = async (req, res, next) => {
  try {
    const { cycleId, revieweeId, ratings, feedback } = req.body;
    const reviewerId = req.user.employeeId;

    if (!reviewerId) {
      return sendResponse(res, 400, false, 'Reviewer must have an Employee profile');
    }

    const cycle = await ReviewCycle.findById(cycleId);
    if (!cycle || cycle.status !== 'active') {
      return sendResponse(res, 400, false, 'Selected review cycle is not active');
    }

    // Check if review was already submitted by this reviewer in this cycle
    const exists = await Review.findOne({ cycleId, revieweeId, reviewerId });
    if (exists) {
      return sendResponse(res, 400, false, 'You have already submitted a review for this colleague in this cycle');
    }

    const review = new Review({
      cycleId,
      revieweeId,
      reviewerId,
      ratings,
      feedback,
    });

    await review.save();
    return sendResponse(res, 201, true, 'Review feedback submitted successfully', review);
  } catch (error) {
    next(error);
  }
};

// GET /api/performance/reviews/summary/:employeeId
exports.getReviewSummary = async (req, res, next) => {
  try {
    const employeeId = req.params.employeeId;

    if (employeeId.toString() !== req.user.employeeId?.toString() && !['Super Admin', 'HR Manager', 'Department Manager'].includes(req.user.role)) {
      return sendResponse(res, 403, false, 'Forbidden: You cannot view rating summary of other employees');
    }

    const reviews = await Review.find({ revieweeId: employeeId });

    if (reviews.length === 0) {
      return sendResponse(res, 200, true, 'No review ratings found for this employee yet', {
        averageRatings: { performance: 0, communication: 0, teamwork: 0, technical: 0 },
        count: 0,
      });
    }

    const totals = { performance: 0, communication: 0, teamwork: 0, technical: 0 };
    reviews.forEach(r => {
      totals.performance += r.ratings.performance || 0;
      totals.communication += r.ratings.communication || 0;
      totals.teamwork += r.ratings.teamwork || 0;
      totals.technical += r.ratings.technical || 0;
    });

    const count = reviews.length;
    const averages = {
      performance: Math.round((totals.performance / count) * 10) / 10,
      communication: Math.round((totals.communication / count) * 10) / 10,
      teamwork: Math.round((totals.teamwork / count) * 10) / 10,
      technical: Math.round((totals.technical / count) * 10) / 10,
    };

    return sendResponse(res, 200, true, 'Review ratings summary generated', {
      averageRatings: averages,
      count,
    });
  } catch (error) {
    next(error);
  }
};
