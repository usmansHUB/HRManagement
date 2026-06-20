const Course = require('../models/Course');
const CourseAssignment = require('../models/CourseAssignment');
const Employee = require('../models/Employee');
const sendResponse = require('../utils/apiResponse');

// ==================== Courses CRUD (Admin / HR) ====================

exports.getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({}).sort({ createdAt: -1 });
    return sendResponse(res, 200, true, 'Courses retrieved successfully', courses);
  } catch (error) {
    next(error);
  }
};

exports.createCourse = async (req, res, next) => {
  try {
    const { title, description, type, url, duration } = req.body;
    
    const course = new Course({
      title,
      description,
      type,
      url,
      duration,
      createdBy: req.user._id,
    });

    await course.save();
    return sendResponse(res, 201, true, 'Course created successfully', course);
  } catch (error) {
    next(error);
  }
};

exports.updateCourse = async (req, res, next) => {
  try {
    const { title, description, type, url, duration } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return sendResponse(res, 404, false, 'Course not found');
    }

    course.title = title || course.title;
    course.description = description || course.description;
    course.type = type || course.type;
    course.url = url || course.url;
    course.duration = duration || course.duration;

    await course.save();
    return sendResponse(res, 200, true, 'Course updated successfully', course);
  } catch (error) {
    next(error);
  }
};

exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return sendResponse(res, 404, false, 'Course not found');
    }
    // Delete assignments for this course
    await CourseAssignment.deleteMany({ courseId: req.params.id });
    return sendResponse(res, 200, true, 'Course and all assignments deleted successfully');
  } catch (error) {
    next(error);
  }
};

// ==================== Course Assignments ====================

exports.getAssignments = async (req, res, next) => {
  try {
    const { employeeId, status } = req.query;
    const query = {};

    if (employeeId) {
      query.employeeId = employeeId;
    } else if (req.user.role === 'Employee') {
      query.employeeId = req.user.employeeId;
    }

    if (status) {
      query.status = status;
    }

    const assignments = await CourseAssignment.find(query)
      .populate('courseId')
      .populate('employeeId', 'firstName lastName employeeCode designation department')
      .sort({ createdAt: -1 });

    return sendResponse(res, 200, true, 'Course assignments retrieved successfully', assignments);
  } catch (error) {
    next(error);
  }
};

exports.assignCourse = async (req, res, next) => {
  try {
    const { courseId, employeeId, departmentId } = req.body;
    const assignedBy = req.user._id;

    if (!courseId) {
      return sendResponse(res, 400, false, 'Course ID is required');
    }

    let targetEmployeeIds = [];

    // Assign by Department
    if (departmentId) {
      const employees = await Employee.find({ department: departmentId, status: 'active' }).select('_id');
      targetEmployeeIds = employees.map(emp => emp._id);
    } 
    // Assign to Single Employee
    else if (employeeId) {
      targetEmployeeIds = [employeeId];
    } else {
      return sendResponse(res, 400, false, 'Specify an Employee ID or a Department ID');
    }

    if (targetEmployeeIds.length === 0) {
      return sendResponse(res, 400, false, 'No active employees found for assignment');
    }

    const createdAssignments = [];
    const errors = [];

    for (const empId of targetEmployeeIds) {
      try {
        const assignment = new CourseAssignment({
          courseId,
          employeeId: empId,
          assignedBy,
          progress: 0,
          status: 'Not Started',
        });
        await assignment.save();
        createdAssignments.push(assignment);
      } catch (err) {
        // Compound unique key catch (duplicate assignment)
        errors.push(`Employee ${empId}: Course already assigned`);
      }
    }

    return sendResponse(res, 201, true, `Course assigned successfully to ${createdAssignments.length} employees`, {
      assignedCount: createdAssignments.length,
      errors,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/lnd/assignments/:id/progress (Employee reporting progress)
exports.updateProgress = async (req, res, next) => {
  try {
    const { progress } = req.body; // percentage (0-100)
    
    if (progress === undefined || progress < 0 || progress > 100) {
      return sendResponse(res, 400, false, 'Progress must be a percentage between 0 and 100');
    }

    const assignment = await CourseAssignment.findById(req.params.id);
    if (!assignment) {
      return sendResponse(res, 404, false, 'Assignment record not found');
    }

    // Permission: Only the employee who is assigned the course, or HR/Admin
    const isSelf = req.user.employeeId && req.user.employeeId.toString() === assignment.employeeId.toString();
    const isHrOrAdmin = ['Super Admin', 'HR Manager'].includes(req.user.role);

    if (!isSelf && !isHrOrAdmin) {
      return sendResponse(res, 403, false, 'Forbidden: You cannot update progress for this assignment');
    }

    assignment.progress = parseInt(progress);
    
    if (assignment.progress === 100) {
      assignment.status = 'Completed';
      assignment.completedAt = new Date();
    } else if (assignment.progress > 0) {
      assignment.status = 'In Progress';
      assignment.completedAt = undefined;
    } else {
      assignment.status = 'Not Started';
      assignment.completedAt = undefined;
    }

    await assignment.save();
    return sendResponse(res, 200, true, 'Training course progress updated successfully', assignment);
  } catch (error) {
    next(error);
  }
};
