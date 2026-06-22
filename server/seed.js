require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Employee = require('./models/Employee');
const Department = require('./models/Department');
const LeaveType = require('./models/LeaveType');
const LeaveBalance = require('./models/LeaveBalance');
const AttendanceLog = require('./models/AttendanceLog');
const Payroll = require('./models/Payroll');
const Job = require('./models/Job');
const Applicant = require('./models/Applicant');
const Goal = require('./models/Goal');
const ReviewCycle = require('./models/ReviewCycle');
const Review = require('./models/Review');
const Course = require('./models/Course');
const CourseAssignment = require('./models/CourseAssignment');
const CompanySettings = require('./models/CompanySettings');

const seedDB = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hrm-db');
    console.log('Connected! Cleaning existing collections...');

    // Clean up collections
    await User.deleteMany({});
    await Employee.deleteMany({});
    await Department.deleteMany({});
    await LeaveType.deleteMany({});
    await LeaveBalance.deleteMany({});
    await AttendanceLog.deleteMany({});
    await Payroll.deleteMany({});
    await Job.deleteMany({});
    await Applicant.deleteMany({});
    await Goal.deleteMany({});
    await ReviewCycle.deleteMany({});
    await Review.deleteMany({});
    await Course.deleteMany({});
    await CourseAssignment.deleteMany({});
    await CompanySettings.deleteMany({});

    console.log('Database cleared! Seeding Company Settings...');
    const settings = new CompanySettings({
      name: 'Vercel HR',
      timezone: 'Asia/Karachi',
      currency: 'PKR',
    });
    await settings.save();

    console.log('Seeding Leave Types...');
    const annualLeave = await LeaveType.create({ name: 'Annual Leave', defaultDays: 15, carryForward: true, isPaid: true });
    const sickLeave = await LeaveType.create({ name: 'Sick Leave', defaultDays: 10, carryForward: false, isPaid: true });
    const casualLeave = await LeaveType.create({ name: 'Casual Leave', defaultDays: 7, carryForward: false, isPaid: true });
    const unpaidLeave = await LeaveType.create({ name: 'Unpaid Leave', defaultDays: 30, carryForward: false, isPaid: false });

    const leaveTypes = [annualLeave, sickLeave, casualLeave, unpaidLeave];

    console.log('Seeding Super Admin...');
    const adminUser = new User({
      name: 'Super Admin',
      email: 'admin@hrm.com',
      passwordHash: 'Admin@123', // Will be hashed by pre-save
      role: 'Super Admin',
      isActive: true,
    });
    await adminUser.save();

    console.log('Creating Departments...');
    const engDept = await Department.create({ name: 'Engineering' });
    const hrDept = await Department.create({ name: 'Human Resources' });
    const salesDept = await Department.create({ name: 'Sales' });

    console.log('Creating Employees & Users...');
    const managers = [];
    const regularEmployees = [];

    // Let's create an HR Manager employee
    const hrManagerUser = new User({
      name: 'Sarah Connor',
      email: 'hr@hrm.com',
      passwordHash: 'Welcome@123',
      role: 'HR Manager',
      isActive: true,
    });
    await hrManagerUser.save();
    
    const hrManagerEmp = await Employee.create({
      userId: hrManagerUser._id,
      employeeCode: 'EMP0001',
      firstName: 'Sarah',
      lastName: 'Connor',
      designation: 'HR Director',
      department: hrDept._id,
      employmentType: 'Full-Time',
      salaryBand: 'Band A',
      status: 'active',
      phone: '+1 555-0101',
      gender: 'Female',
      joiningDate: new Date('2024-01-15'),
    });
    hrManagerUser.employeeId = hrManagerEmp._id;
    await hrManagerUser.save();
    managers.push(hrManagerEmp);
    hrDept.headId = hrManagerEmp._id;
    await hrDept.save();

    // Create Engineering Manager
    const engManagerUser = new User({
      name: 'John Doe',
      email: 'engmanager@hrm.com',
      passwordHash: 'Welcome@123',
      role: 'Department Manager',
      isActive: true,
    });
    await engManagerUser.save();

    const engManagerEmp = await Employee.create({
      userId: engManagerUser._id,
      employeeCode: 'EMP0002',
      firstName: 'John',
      lastName: 'Doe',
      designation: 'VP of Engineering',
      department: engDept._id,
      employmentType: 'Full-Time',
      salaryBand: 'Band A',
      status: 'active',
      phone: '+1 555-0102',
      gender: 'Male',
      joiningDate: new Date('2024-02-01'),
    });
    engManagerUser.employeeId = engManagerEmp._id;
    await engManagerUser.save();
    managers.push(engManagerEmp);
    engDept.headId = engManagerEmp._id;
    await engDept.save();

    // Create Sales Manager
    const salesManagerUser = new User({
      name: 'Jane Smith',
      email: 'salesmanager@hrm.com',
      passwordHash: 'Welcome@123',
      role: 'Department Manager',
      isActive: true,
    });
    await salesManagerUser.save();

    const salesManagerEmp = await Employee.create({
      userId: salesManagerUser._id,
      employeeCode: 'EMP0003',
      firstName: 'Jane',
      lastName: 'Smith',
      designation: 'Sales Director',
      department: salesDept._id,
      employmentType: 'Full-Time',
      salaryBand: 'Band A',
      status: 'active',
      phone: '+1 555-0103',
      gender: 'Female',
      joiningDate: new Date('2024-03-01'),
    });
    salesManagerUser.employeeId = salesManagerEmp._id;
    await salesManagerUser.save();
    managers.push(salesManagerEmp);
    salesDept.headId = salesManagerEmp._id;
    await salesDept.save();

    // Now seed 17 regular employees
    const firstNames = [
      'David', 'Emily', 'Michael', 'Jessica', 'James', 'Olivia', 'Robert', 'Sophia', 
      'William', 'Isabella', 'Joseph', 'Mia', 'Daniel', 'Charlotte', 'Thomas', 'Amelia', 'Charles'
    ];
    const lastNames = [
      'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson', 'Martinez', 'Anderson', 'Taylor', 
      'Thomas', 'Hernandez', 'Moore', 'Martin', 'Jackson', 'Thompson', 'White', 'Lopez', 'Lee'
    ];
    const depts = [engDept._id, hrDept._id, salesDept._id];
    const designations = {
      [engDept._id]: ['Software Engineer', 'Senior Developer', 'DevOps Specialist', 'Frontend Engineer', 'Backend Developer'],
      [hrDept._id]: ['HR Coordinator', 'Recruiter', 'Compensation Analyst'],
      [salesDept._id]: ['Account Executive', 'Business Development Representative', 'Sales Specialist']
    };
    const bands = ['Band B', 'Band C', 'Band D'];

    for (let i = 0; i < 17; i++) {
      const idx = i % depts.length;
      const deptId = depts[idx];
      const designList = designations[deptId];
      const designation = designList[i % designList.length];
      const manager = deptId.equals(engDept._id) ? engManagerEmp : (deptId.equals(hrDept._id) ? hrManagerEmp : salesManagerEmp);

      const fName = firstNames[i];
      const lName = lastNames[i];
      const email = `${fName.toLowerCase()}.${lName.toLowerCase()}@hrm.com`;
      const code = `EMP${String(i + 4).padStart(4, '0')}`;

      const user = new User({
        name: `${fName} ${lName}`,
        email,
        passwordHash: 'Welcome@123',
        role: 'Employee',
        isActive: true,
      });
      await user.save();

      const emp = await Employee.create({
        userId: user._id,
        employeeCode: code,
        firstName: fName,
        lastName: lName,
        designation,
        department: deptId,
        managerId: manager._id,
        employmentType: i % 5 === 0 ? 'Contract' : 'Full-Time',
        salaryBand: bands[i % bands.length],
        status: 'active',
        phone: `+1 555-01${i + 10}`,
        gender: i % 2 === 0 ? 'Male' : 'Female',
        joiningDate: new Date(`2024-06-${(i % 28) + 1}`),
      });

      user.employeeId = emp._id;
      await user.save();
      regularEmployees.push(emp);
    }

    const allEmployees = [...managers, ...regularEmployees];
    console.log(`Seeded ${allEmployees.length} total employees. Generating Leave Balances...`);

    const currentYear = new Date().getFullYear();
    for (const emp of allEmployees) {
      for (const lt of leaveTypes) {
        await LeaveBalance.create({
          employeeId: emp._id,
          leaveTypeId: lt._id,
          year: currentYear,
          allocated: lt.defaultDays,
          remaining: lt.defaultDays,
          used: 0,
        });
      }
    }

    console.log('Generating Attendance Logs (last 5 business days)...');
    const logs = [];
    const today = new Date();
    
    // We will generate logs for the last 5 days
    for (let dayOffset = 5; dayOffset >= 1; dayOffset--) {
      const logDate = new Date();
      logDate.setDate(today.getDate() - dayOffset);
      logDate.setHours(0,0,0,0);
      
      // Skip weekends
      if (logDate.getDay() === 0 || logDate.getDay() === 6) continue;

      for (const emp of allEmployees) {
        // 90% chance of being present, 5% late, 5% absent
        const roll = Math.random();
        let status = 'present';
        let clockIn = null;
        let clockOut = null;
        let totalHours = 0;

        if (roll < 0.85) {
          status = 'present';
          clockIn = new Date(logDate);
          clockIn.setHours(8, 45 + Math.floor(Math.random() * 20), 0); // 8:45 AM to 9:05 AM
          clockOut = new Date(logDate);
          clockOut.setHours(17, Math.floor(Math.random() * 30), 0); // 5:00 PM to 5:30 PM
          totalHours = (clockOut - clockIn) / (1000 * 60 * 60);
        } else if (roll < 0.95) {
          status = 'late';
          clockIn = new Date(logDate);
          clockIn.setHours(9, 20 + Math.floor(Math.random() * 30), 0); // 9:20 AM to 9:50 AM (cutoff is 9:15)
          clockOut = new Date(logDate);
          clockOut.setHours(17, Math.floor(Math.random() * 30), 0);
          totalHours = (clockOut - clockIn) / (1000 * 60 * 60);
        } else {
          status = 'absent';
        }

        await AttendanceLog.create({
          employeeId: emp._id,
          date: logDate,
          clockIn,
          clockOut,
          totalHours: Math.round(totalHours * 100) / 100,
          overtime: totalHours > 8 ? Math.round((totalHours - 8) * 100) / 100 : 0,
          status,
          location: Math.random() > 0.3 ? 'On-site Office' : 'Remote WFH',
          device: 'Browser Panel',
        });
      }
    }

    console.log('Generating Payroll History for last month...');
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const pMonth = lastMonth.getMonth() + 1;
    const pYear = lastMonth.getFullYear();

    const bandsSalary = { 'Band A': 150000, 'Band B': 100000, 'Band C': 70000, 'Band D': 40000 };
    for (const emp of allEmployees) {
      const basic = bandsSalary[emp.salaryBand] || 50000;
      const allowances = [
        { name: 'Housing Allowance', amount: Math.round(basic * 0.1) },
        { name: 'Transport Allowance', amount: Math.round(basic * 0.05) }
      ];
      const deductions = [
        { name: 'Provident Fund', amount: Math.round(basic * 0.08) },
        { name: 'Health Insurance', amount: 150 }
      ];
      const totalAllowances = allowances.reduce((acc, a) => acc + a.amount, 0);
      const totalDeductions = deductions.reduce((acc, d) => acc + d.amount, 0);
      const taxAmount = Math.round(basic * 0.1);
      const netPay = basic + totalAllowances - totalDeductions - taxAmount;

      await Payroll.create({
        employeeId: emp._id,
        month: pMonth,
        year: pYear,
        basicSalary: basic,
        allowances,
        deductions,
        taxAmount,
        netPay,
        status: 'paid',
        payslipUrl: `/api/payroll/payslip/temp_${emp._id}_${pMonth}_${pYear}.pdf`,
        processedAt: new Date(),
      });
    }

    console.log('Seeding Job Openings & Applicants (ATS)...');
    const job1 = await Job.create({
      title: 'Senior Full Stack Engineer (Vue/Node)',
      department: 'Engineering',
      type: 'Full-Time',
      description: 'We are looking for a Senior Full Stack Engineer to lead our client-facing portal development. Experience in Vue 3 and Node/Express is highly valued.',
      requirements: '5+ years in Javascript/Typescript development, proficiency in Vue 3 (Composition API), Express REST APIs, Mongoose and general cloud platforms.',
      createdBy: adminUser._id,
      status: 'open',
    });

    const job2 = await Job.create({
      title: 'Lead Product Designer',
      department: 'Product',
      type: 'Full-Time',
      description: 'Join us to design the future of human resource management platforms. Build premium visual systems inspired by Linear and Stripe.',
      requirements: '4+ years of UI/UX design experience, high-fidelity Figma mastery, prototyping animations, web design guidelines.',
      createdBy: adminUser._id,
      status: 'open',
    });

    // Create 3 applicants for job1
    await Applicant.create({
      jobId: job1._id,
      name: 'Michael Scott',
      email: 'michael.scott@dundermifflin.com',
      phone: '+1 555-8833',
      resumeUrl: '/uploads/resumes/mock_resume_michael.pdf',
      stage: 'Applied',
      notes: [{ author: 'Sarah Connor', text: 'Looks like a decent candidate, need to schedule a screener call.' }],
    });

    await Applicant.create({
      jobId: job1._id,
      name: 'Pam Beesly',
      email: 'pam.beesly@dundermifflin.com',
      phone: '+1 555-8844',
      resumeUrl: '/uploads/resumes/mock_resume_pam.pdf',
      stage: 'Screened',
      notes: [
        { author: 'Sarah Connor', text: 'Good communication skills, passed HR screening.' },
        { author: 'John Doe', text: 'Ready for tech interview phase.' }
      ],
    });

    await Applicant.create({
      jobId: job1._id,
      name: 'Jim Halpert',
      email: 'jim.halpert@dundermifflin.com',
      phone: '+1 555-8855',
      resumeUrl: '/uploads/resumes/mock_resume_jim.pdf',
      stage: 'Interview',
      notes: [
        { author: 'Sarah Connor', text: 'Friendly, fit for cultural values.' },
        { author: 'John Doe', text: 'Excellent technical session. Demonstrated deep knowledge in Vue reactivity.' }
      ],
    });

    console.log('Seeding Goals (OKRs)...');
    const rCycle = await ReviewCycle.create({
      name: '2026 Annual Goal Cycle',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      status: 'active',
      createdBy: adminUser._id,
    });

    // Set goals for a few employees
    await Goal.create({
      employeeId: engManagerEmp._id,
      cycleId: rCycle._id,
      title: 'Scale Infrastructure to 10k Active Users',
      description: 'Optimize MongoDB indexes, configure server clustering, and implement Redis caching to support scaling targets.',
      type: 'OKR',
      targetValue: 100,
      currentValue: 40,
      status: 'In Progress',
      dueDate: new Date('2026-12-31'),
    });

    await Goal.create({
      employeeId: regularEmployees[0]._id, // first regular developer
      cycleId: rCycle._id,
      title: 'Complete 3D Interactive Features for Portal',
      description: 'Implement responsive Three.js particle backgrounds and interactive meshes on onboarding panels.',
      type: 'OKR',
      targetValue: 100,
      currentValue: 100,
      status: 'Achieved',
      dueDate: new Date('2026-09-30'),
    });

    console.log('Seeding Courses (L&D)...');
    const course1 = await Course.create({
      title: 'Introduction to Vue 3 Composition API',
      description: 'Master ref, reactive, computed, and composable functions in Vue 3. Recommended for all frontend engineers.',
      type: 'video',
      url: 'https://vimeo.com/mock-vue3-course',
      duration: '3 hours',
      createdBy: adminUser._id,
    });

    const course2 = await Course.create({
      title: 'Cybersecurity Awareness Training',
      description: 'Learn how to prevent social engineering, secure passwords, and identify phishing attempts.',
      type: 'doc',
      url: 'https://docs.hrm.com/training/cybersecurity',
      duration: '45 mins',
      createdBy: adminUser._id,
    });

    // Assign courses to some employees
    await CourseAssignment.create({
      courseId: course1._id,
      employeeId: regularEmployees[0]._id,
      assignedBy: adminUser._id,
      progress: 60,
      status: 'In Progress',
    });

    await CourseAssignment.create({
      courseId: course2._id,
      employeeId: regularEmployees[1]._id,
      assignedBy: adminUser._id,
      progress: 100,
      status: 'Completed',
      completedAt: new Date(),
    });

    console.log('=========================================');
    console.log('DATABASE SEEDED SUCCESSFULLY!');
    console.log('-----------------------------------------');
    console.log('Admin Access: admin@hrm.com / Admin@123');
    console.log('HR Access: hr@hrm.com / Welcome@123');
    console.log('Manager Access: engmanager@hrm.com / Welcome@123');
    console.log('Employee Access: david.miller@hrm.com / Welcome@123');
    console.log('=========================================');
    
    mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seeding database failed:', error);
    process.exit(1);
  }
};

seedDB();
