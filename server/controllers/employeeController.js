const Employee = require('../models/Employee');
const User = require('../models/User');
const Department = require('../models/Department');
const { uploadFile } = require('../config/cloudinary');
const sendResponse = require('../utils/apiResponse');

// GET /api/employees
exports.getEmployees = async (req, res, next) => {
  try {
    const { search, department, status, page = 1, limit = 10 } = req.query;

    const query = {};

    // Apply Search (firstName, lastName, employeeCode)
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { employeeCode: searchRegex },
        { designation: searchRegex },
      ];
    }

    // Apply Filters
    if (department) {
      query.department = department;
    }
    if (status) {
      query.status = status;
    }

    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const skip = (parsedPage - 1) * parsedLimit;

    const total = await Employee.countDocuments(query);
    const employees = await Employee.find(query)
      .populate('department', 'name')
      .populate('managerId', 'firstName lastName employeeCode')
      .populate('userId', 'email role isActive')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit);

    const pagination = {
      page: parsedPage,
      limit: parsedLimit,
      total,
      pages: Math.ceil(total / parsedLimit),
    };

    return sendResponse(res, 200, true, 'Employees fetched successfully', employees, pagination);
  } catch (error) {
    next(error);
  }
};

// GET /api/employees/org-chart
exports.getOrgChart = async (req, res, next) => {
  try {
    const employees = await Employee.find({ status: 'active' })
      .select('_id firstName lastName designation managerId avatar')
      .lean();

    // Map employees by managerId
    const employeeMap = {};
    employees.forEach(emp => {
      employeeMap[emp._id] = { ...emp, children: [] };
    });

    const root = [];
    employees.forEach(emp => {
      const mapped = employeeMap[emp._id];
      if (emp.managerId && employeeMap[emp.managerId]) {
        employeeMap[emp.managerId].children.push(mapped);
      } else {
        root.push(mapped);
      }
    });

    return sendResponse(res, 200, true, 'Organization chart fetched successfully', root);
  } catch (error) {
    next(error);
  }
};

// GET /api/employees/:id
exports.getEmployeeById = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('department')
      .populate('managerId', 'firstName lastName employeeCode designation avatar')
      .populate('userId', 'email role isActive');

    if (!employee) {
      return sendResponse(res, 404, false, 'Employee not found');
    }

    return sendResponse(res, 200, true, 'Employee fetched successfully', employee);
  } catch (error) {
    next(error);
  }
};

// POST /api/employees
exports.createEmployee = async (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role = 'Employee',
      phone,
      dob,
      gender,
      address,
      department,
      designation,
      managerId,
      joiningDate,
      employmentType,
      salaryBand,
    } = req.body;

    // Check if email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return sendResponse(res, 400, false, 'A user account with this email already exists');
    }

    // Handle files if uploaded (via multer)
    let avatarUrl = '';
    if (req.files && req.files['avatar']) {
      avatarUrl = await uploadFile(req.files['avatar'][0], 'avatars');
    }

    let documentList = [];
    if (req.files && req.files['documents']) {
      for (const file of req.files['documents']) {
        const fileUrl = await uploadFile(file, 'documents');
        documentList.push({
          name: file.originalname,
          url: fileUrl,
        });
      }
    }

    // Generate unique employee code
    const count = await Employee.countDocuments({});
    const code = `EMP${String(count + 1).padStart(4, '0')}`;

    // Create User credentials
    const user = new User({
      name: `${firstName} ${lastName}`,
      email,
      passwordHash: password || 'Welcome@123',
      role,
    });
    
    // Create Employee record
    const employee = new Employee({
      employeeCode: code,
      firstName,
      lastName,
      avatar: avatarUrl,
      phone,
      dob,
      gender,
      address,
      department: department || null,
      designation,
      managerId: managerId || null,
      joiningDate,
      employmentType,
      salaryBand,
      status: 'active',
      documents: documentList,
    });

    await employee.save();

    user.employeeId = employee._id;
    await user.save();

    employee.userId = user._id;
    await employee.save();

    const populated = await Employee.findById(employee._id)
      .populate('department')
      .populate('managerId', 'firstName lastName')
      .populate('userId', 'email role');

    return sendResponse(res, 201, true, 'Employee created successfully', populated);
  } catch (error) {
    next(error);
  }
};

// PUT /api/employees/:id
exports.updateEmployee = async (req, res, next) => {
  try {
    const employeeId = req.params.id;
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee not found');
    }

    // Check permissions: Admin, HR Manager, or the employee themselves
    const isSelf = req.user.employeeId && req.user.employeeId.toString() === employeeId;
    const isHrOrAdmin = ['Super Admin', 'HR Manager'].includes(req.user.role);

    if (!isSelf && !isHrOrAdmin) {
      return sendResponse(res, 403, false, 'Forbidden: You cannot modify this profile');
    }

    const {
      firstName,
      lastName,
      phone,
      dob,
      gender,
      address,
      department,
      designation,
      managerId,
      joiningDate,
      employmentType,
      salaryBand,
      status,
      email,
      emergencyContacts,
      dependents,
      qualifications,
      salaryDetails,
      immigration,
    } = req.body;

    // Self-update is restricted
    if (isSelf && !isHrOrAdmin) {
      // Only allow basic details editing for Employee self-service
      employee.firstName = firstName || employee.firstName;
      employee.lastName = lastName || employee.lastName;
      employee.phone = phone || employee.phone;
      employee.dob = dob || employee.dob;
      employee.gender = gender || employee.gender;
      employee.address = address || employee.address;

      if (qualifications !== undefined) {
        try {
          employee.qualifications = typeof qualifications === 'string' ? JSON.parse(qualifications || '{}') : qualifications;
        } catch (e) {
          console.error("Error parsing qualifications:", e);
        }
      }
    } else {
      // Admin/HR Full updates
      employee.firstName = firstName || employee.firstName;
      employee.lastName = lastName || employee.lastName;
      employee.phone = phone !== undefined ? phone : employee.phone;
      employee.dob = dob !== undefined ? dob : employee.dob;
      employee.gender = gender || employee.gender;
      employee.address = address !== undefined ? address : employee.address;
      employee.designation = designation || employee.designation;
      employee.employmentType = employmentType || employee.employmentType;
      employee.salaryBand = salaryBand || employee.salaryBand;
      employee.status = status || employee.status;

      if (department !== undefined) {
        employee.department = department === '' ? null : department;
      }
      if (managerId !== undefined) {
        employee.managerId = managerId === '' ? null : managerId;
      }
      if (joiningDate) {
        employee.joiningDate = joiningDate;
      }

      if (qualifications !== undefined) {
        try {
          employee.qualifications = typeof qualifications === 'string' ? JSON.parse(qualifications || '{}') : qualifications;
        } catch (e) {
          console.error("Error parsing qualifications:", e);
        }
      }
      if (salaryDetails !== undefined) {
        try {
          employee.salaryDetails = typeof salaryDetails === 'string' ? JSON.parse(salaryDetails || '{}') : salaryDetails;
        } catch (e) {
          console.error("Error parsing salaryDetails:", e);
        }
      }
      if (immigration !== undefined) {
        try {
          employee.immigration = typeof immigration === 'string' ? JSON.parse(immigration || '{}') : immigration;
        } catch (e) {
          console.error("Error parsing immigration:", e);
        }
      }
    }

    if (emergencyContacts !== undefined) {
      employee.emergencyContacts = Array.isArray(emergencyContacts) ? emergencyContacts : JSON.parse(emergencyContacts || '[]');
    }
    if (dependents !== undefined) {
      employee.dependents = Array.isArray(dependents) ? dependents : JSON.parse(dependents || '[]');
    }

    // Update associated user's name if first/last name changed
    if (employee.userId) {
      const user = await User.findById(employee.userId);
      if (user) {
        user.name = `${employee.firstName} ${employee.lastName}`;
        // Only allow email change if requested by Admin/HR
        if (!isSelf && isHrOrAdmin && email && email !== user.email) {
          // Validate new email is unique
          const emailInUse = await User.findOne({ email, _id: { $ne: user._id } });
          if (emailInUse) {
            return sendResponse(res, 400, false, 'Email is already in use by another user');
          }
          user.email = email;
        }
        await user.save();
      }
    }

    // Handle single file uploads if updated
    if (req.files && req.files['avatar']) {
      employee.avatar = await uploadFile(req.files['avatar'][0], 'avatars');
    }

    if (req.files && req.files['documents']) {
      for (const file of req.files['documents']) {
        const fileUrl = await uploadFile(file, 'documents');
        employee.documents.push({
          name: file.originalname,
          url: fileUrl,
        });
      }
    }

    await employee.save();

    const updated = await Employee.findById(employeeId)
      .populate('department')
      .populate('managerId', 'firstName lastName')
      .populate('userId', 'email role');

    return sendResponse(res, 200, true, 'Employee profile updated successfully', updated);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/employees/:id
exports.deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return sendResponse(res, 404, false, 'Employee not found');
    }

    // Mark inactive/terminated rather than hard deletion to maintain history
    employee.status = 'terminated';
    await employee.save();

    if (employee.userId) {
      const user = await User.findById(employee.userId);
      if (user) {
        user.isActive = false;
        await user.save();
      }
    }

    return sendResponse(res, 200, true, 'Employee status marked as terminated successfully');
  } catch (error) {
    next(error);
  }
};

// POST /api/employees/bulk-import (CSV data parsing)
exports.bulkImport = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendResponse(res, 400, false, 'Please upload a CSV file');
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const rows = csvContent.split('\n').map(row => row.trim()).filter(row => row);
    
    if (rows.length < 2) {
      return sendResponse(res, 400, false, 'CSV file has no data');
    }

    const parseCsvRow = (row) => {
      const cells = [];
      let insideQuote = false;
      let currentCell = '';
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
          insideQuote = !insideQuote;
        } else if (char === ',' && !insideQuote) {
          cells.push(currentCell.replace(/^"(.*)"$/, '$1').trim()); // strip outer quotes
          currentCell = '';
        } else {
          currentCell += char;
        }
      }
      cells.push(currentCell.replace(/^"(.*)"$/, '$1').trim());
      return cells;
    };

    // Headers format: firstName,lastName,email,designation,salaryBand,employmentType
    const headers = parseCsvRow(rows[0]);
    const employeesData = [];

    for (let i = 1; i < rows.length; i++) {
      const cells = parseCsvRow(rows[i]);
      if (cells.length < headers.length) continue;

      const empObj = {};
      headers.forEach((header, idx) => {
        empObj[header] = cells[idx];
      });
      employeesData.push(empObj);
    }

    let successCount = 0;
    const errors = [];

    for (const data of employeesData) {
      try {
        const { firstName, lastName, email, designation, salaryBand, employmentType } = data;

        if (!firstName || !lastName || !email || !designation || !salaryBand) {
          errors.push(`Row ${employeesData.indexOf(data) + 2}: Missing required fields`);
          continue;
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
          errors.push(`Row ${employeesData.indexOf(data) + 2}: Email ${email} is already in use`);
          continue;
        }

        const count = await Employee.countDocuments({});
        const code = `EMP${String(count + 1).padStart(4, '0')}`;

        const user = new User({
          name: `${firstName} ${lastName}`,
          email,
          passwordHash: 'Welcome@123',
          role: 'Employee',
        });

        const employee = new Employee({
          employeeCode: code,
          firstName,
          lastName,
          designation,
          salaryBand,
          employmentType: employmentType || 'Full-Time',
          status: 'active',
        });

        await employee.save();
        user.employeeId = employee._id;
        await user.save();

        employee.userId = user._id;
        await employee.save();

        successCount++;
      } catch (err) {
        errors.push(`Row ${employeesData.indexOf(data) + 2}: ${err.message}`);
      }
    }

    return sendResponse(res, 200, true, `CSV Bulk Import finished. Successfully imported ${successCount} records.`, {
      successCount,
      failedCount: errors.length,
      errors,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/employees/export/csv
exports.exportCsv = async (req, res, next) => {
  try {
    const employees = await Employee.find({}).populate('department', 'name');
    
    let csvString = 'EmployeeCode,First Name,Last Name,Designation,Department,Employment Type,Salary Band,Status,Joining Date\n';
    
    employees.forEach(emp => {
      const deptName = emp.department ? emp.department.name : '';
      const dateStr = emp.joiningDate ? emp.joiningDate.toISOString().split('T')[0] : '';
      csvString += `"${emp.employeeCode}","${emp.firstName}","${emp.lastName}","${emp.designation}","${deptName}","${emp.employmentType}","${emp.salaryBand}","${emp.status}","${dateStr}"\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment('employees.csv');
    return res.send(csvString);
  } catch (error) {
    next(error);
  }
};

// GET /api/employees/directory
exports.getEmployeeDirectory = async (req, res, next) => {
  try {
    const { search, department } = req.query;
    const query = { status: 'active' };

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { employeeCode: searchRegex },
        { designation: searchRegex },
      ];
    }

    if (department) {
      query.department = department;
    }

    const directory = await Employee.find(query)
      .select('firstName lastName avatar employeeCode designation department phone userId')
      .populate('department', 'name')
      .populate('userId', 'email')
      .sort({ firstName: 1 });

    return sendResponse(res, 200, true, 'Directory fetched successfully', directory);
  } catch (error) {
    next(error);
  }
};
