const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const { generatePayslipPdf } = require('../services/pdfGenerator');
const sendResponse = require('../utils/apiResponse');

// Helper to determine basic salary from band
const getBasicSalaryFromBand = (band) => {
  const bands = {
    'Band A': 10000,
    'Band B': 6000,
    'Band C': 4000,
    'Band D': 2500,
  };
  return bands[band] || 3000;
};

// GET /api/payroll/run - Review/draft payroll calculations for all employees
exports.getPayrollDraft = async (req, res, next) => {
  try {
    const month = parseInt(req.query.month || new Date().getMonth() + 1);
    const year = parseInt(req.query.year || new Date().getFullYear());

    // Check if payroll already exists for this month/year
    const existing = await Payroll.find({ month, year }).populate('employeeId', 'firstName lastName employeeCode designation department');
    if (existing.length > 0) {
      return sendResponse(res, 200, true, 'Payroll for this month has already been processed', existing);
    }

    // Otherwise, generate a draft list dynamically
    const employees = await Employee.find({ status: 'active' }).populate('department', 'name');
    const draftPayrolls = [];

    employees.forEach(emp => {
      const basic = getBasicSalaryFromBand(emp.salaryBand);
      
      // Default allowances
      const allowances = [
        { name: 'Housing Allowance', amount: Math.round(basic * 0.1) }, // 10%
        { name: 'Transport Allowance', amount: Math.round(basic * 0.05) }, // 5%
      ];
      
      // Default deductions
      const deductions = [
        { name: 'Provident Fund', amount: Math.round(basic * 0.08) }, // 8%
        { name: 'Health Insurance', amount: 150 },
      ];

      const totalAllowances = allowances.reduce((acc, a) => acc + a.amount, 0);
      const totalDeductions = deductions.reduce((acc, d) => acc + d.amount, 0);
      
      // 10% tax on basic
      const taxAmount = Math.round(basic * 0.1);
      const netPay = basic + totalAllowances - totalDeductions - taxAmount;

      draftPayrolls.push({
        employeeId: {
          _id: emp._id,
          employeeCode: emp.employeeCode,
          firstName: emp.firstName,
          lastName: emp.lastName,
          designation: emp.designation,
          department: emp.department,
        },
        month,
        year,
        basicSalary: basic,
        allowances,
        deductions,
        taxAmount,
        netPay,
        status: 'draft',
      });
    });

    return sendResponse(res, 200, true, 'Payroll draft generated successfully', draftPayrolls);
  } catch (error) {
    next(error);
  }
};

// POST /api/payroll/run - Commit/process payroll
exports.processPayroll = async (req, res, next) => {
  try {
    const { month, year, payrolls } = req.body;

    if (!month || !year || !payrolls || payrolls.length === 0) {
      return sendResponse(res, 400, false, 'Invalid payroll data provided');
    }

    const processedItems = [];

    for (const item of payrolls) {
      // Allowances & deductions validation
      const allowances = item.allowances || [];
      const deductions = item.deductions || [];
      
      const totalAllowances = allowances.reduce((acc, a) => acc + a.amount, 0);
      const totalDeductions = deductions.reduce((acc, d) => acc + d.amount, 0);
      const taxAmount = item.taxAmount || 0;
      
      const netPay = item.basicSalary + totalAllowances - totalDeductions - taxAmount;

      // Upsert payroll record
      const record = await Payroll.findOneAndUpdate(
        { employeeId: item.employeeId, month, year },
        {
          basicSalary: item.basicSalary,
          allowances,
          deductions,
          taxAmount,
          netPay,
          status: 'paid',
          processedAt: new Date(),
          payslipUrl: `/api/payroll/payslip/temp_${item.employeeId}_${month}_${year}.pdf`, // temporary URL
        },
        { new: true, upsert: true }
      );

      processedItems.push(record);
    }

    return sendResponse(res, 201, true, `Payroll processed successfully for ${processedItems.length} employees`, processedItems);
  } catch (error) {
    next(error);
  }
};

// GET /api/payroll/history
exports.getPayrollHistory = async (req, res, next) => {
  try {
    const { employeeId, month, year } = req.query;
    const query = {};

    if (employeeId) {
      query.employeeId = employeeId;
    } else if (req.user.role === 'Employee') {
      // Employees only see their own payslips
      query.employeeId = req.user.employeeId;
    }

    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);

    const history = await Payroll.find(query)
      .populate({
        path: 'employeeId',
        select: 'firstName lastName employeeCode designation department avatar',
        populate: { path: 'department', select: 'name' }
      })
      .sort({ year: -1, month: -1 });

    return sendResponse(res, 200, true, 'Payroll history fetched successfully', history);
  } catch (error) {
    next(error);
  }
};

// GET /api/payroll/payslip/:id
exports.downloadPayslip = async (req, res, next) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate({
        path: 'employeeId',
        populate: { path: 'department', select: 'name' }
      });

    if (!payroll) {
      return sendResponse(res, 404, false, 'Payroll record not found');
    }

    // Permissions: Admin, HR Manager, or the employee themselves
    const isSelf = req.user.employeeId && req.user.employeeId.toString() === payroll.employeeId._id.toString();
    const isHrOrAdmin = ['Super Admin', 'HR Manager'].includes(req.user.role);

    if (!isSelf && !isHrOrAdmin) {
      return sendResponse(res, 403, false, 'Forbidden: You cannot access this payslip');
    }

    const doc = generatePayslipPdf(payroll);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payslip_${payroll.year}_${payroll.month}.pdf`);

    doc.pipe(res);
    doc.end();
  } catch (error) {
    next(error);
  }
};
