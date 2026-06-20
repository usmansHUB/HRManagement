const CompanySettings = require('../models/CompanySettings');
const Department = require('../models/Department');
const { uploadFile } = require('../config/cloudinary');
const sendResponse = require('../utils/apiResponse');

// ==================== Company Settings ====================

exports.getCompanySettings = async (req, res, next) => {
  try {
    let settings = await CompanySettings.findOne({});
    if (!settings) {
      settings = new CompanySettings();
      await settings.save();
    }
    return sendResponse(res, 200, true, 'Company settings retrieved successfully', settings);
  } catch (error) {
    next(error);
  }
};

exports.updateCompanySettings = async (req, res, next) => {
  try {
    const { name, timezone, currency } = req.body;
    let settings = await CompanySettings.findOne({});
    
    if (!settings) {
      settings = new CompanySettings();
    }

    settings.name = name || settings.name;
    settings.timezone = timezone || settings.timezone;
    settings.currency = currency || settings.currency;

    if (req.file) {
      settings.logo = await uploadFile(req.file, 'company_logo');
    }

    await settings.save();
    return sendResponse(res, 200, true, 'Company settings updated successfully', settings);
  } catch (error) {
    next(error);
  }
};

// ==================== Departments CRUD ====================

exports.getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({})
      .populate('headId', 'firstName lastName employeeCode designation avatar')
      .populate('parentDept', 'name');
      
    return sendResponse(res, 200, true, 'Departments retrieved successfully', departments);
  } catch (error) {
    next(error);
  }
};

exports.createDepartment = async (req, res, next) => {
  try {
    const { name, headId, parentDept } = req.body;

    const exists = await Department.findOne({ name });
    if (exists) {
      return sendResponse(res, 400, false, 'Department with this name already exists');
    }

    const dept = new Department({
      name,
      headId: headId || null,
      parentDept: parentDept || null,
    });

    await dept.save();
    return sendResponse(res, 201, true, 'Department created successfully', dept);
  } catch (error) {
    next(error);
  }
};

exports.updateDepartment = async (req, res, next) => {
  try {
    const { name, headId, parentDept } = req.body;
    const dept = await Department.findById(req.params.id);

    if (!dept) {
      return sendResponse(res, 404, false, 'Department not found');
    }

    dept.name = name || dept.name;
    
    if (headId !== undefined) {
      dept.headId = headId === '' ? null : headId;
    }
    if (parentDept !== undefined) {
      dept.parentDept = parentDept === '' ? null : parentDept;
    }

    await dept.save();
    return sendResponse(res, 200, true, 'Department updated successfully', dept);
  } catch (error) {
    next(error);
  }
};

exports.deleteDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findByIdAndDelete(req.params.id);
    if (!dept) {
      return sendResponse(res, 404, false, 'Department not found');
    }
    return sendResponse(res, 200, true, 'Department deleted successfully');
  } catch (error) {
    next(error);
  }
};
