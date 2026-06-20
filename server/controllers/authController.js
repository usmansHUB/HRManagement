const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Employee = require('../models/Employee');
const sendResponse = require('../utils/apiResponse');
const transporter = require('../config/nodemailer');

const ACCESS_TOKEN_EXPIRY = '1h'; // 1 hour as requested by the user
const REFRESH_TOKEN_EXPIRY = '7d';

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, employeeId: user.employeeId },
    process.env.JWT_ACCESS_SECRET || 'dev_access_secret_key_hrm_99332211',
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_key_hrm_11223399',
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
};

const setRefreshTokenCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return sendResponse(res, 400, false, 'User already exists');
    }

    // Create User
    const user = new User({
      name,
      email,
      passwordHash: password, // Will be hashed in pre-save hook
      role: role || 'Employee',
    });

    // If registering an employee role, create a default Employee record
    if (user.role !== 'Super Admin') {
      const code = 'EMP' + Math.floor(100000 + Math.random() * 900000);
      const employee = new Employee({
        employeeCode: code,
        firstName: name.split(' ')[0] || name,
        lastName: name.split(' ').slice(1).join(' ') || 'Employee',
        designation: user.role === 'HR Manager' ? 'HR Specialist' : (user.role === 'Department Manager' ? 'Team Lead' : 'Software Engineer'),
        salaryBand: 'Band B',
        employmentType: 'Full-Time',
        status: 'active',
      });
      await employee.save();
      user.employeeId = employee._id;
      employee.userId = user._id;
      await employee.save();
    }

    await user.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    user.refreshToken = refreshToken;
    await user.save();

    setRefreshTokenCookie(res, refreshToken);

    return sendResponse(res, 201, true, 'User registered successfully', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
      },
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate('employeeId');
    if (!user) {
      return sendResponse(res, 401, false, 'Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendResponse(res, 401, false, 'Invalid email or password');
    }

    if (!user.isActive) {
      return sendResponse(res, 403, false, 'Your account has been deactivated');
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    setRefreshTokenCookie(res, refreshToken);

    return sendResponse(res, 200, true, 'Login successful', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId ? user.employeeId._id : null,
        employeeCode: user.employeeId ? user.employeeId.employeeCode : null,
      },
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      return sendResponse(res, 401, false, 'Refresh token not found');
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_key_hrm_11223399');
    } catch (err) {
      return sendResponse(res, 401, false, 'Invalid refresh token');
    }

    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return sendResponse(res, 401, false, 'Session expired, please login again');
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    user.refreshToken = newRefreshToken;
    await user.save();

    setRefreshTokenCookie(res, newRefreshToken);

    return sendResponse(res, 200, true, 'Token refreshed successfully', {
      accessToken: newAccessToken,
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (refreshToken) {
      const user = await User.findOne({ refreshToken });
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    }

    res.clearCookie('refreshToken');
    return sendResponse(res, 200, true, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return sendResponse(res, 404, false, 'User with this email not found');
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    user.otp = { code: otpCode, expiresAt };
    await user.save();

    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@hrm-app.com',
      to: user.email,
      subject: 'HRM Password Reset OTP',
      text: `Your OTP to reset password is ${otpCode}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e8ed; border-radius: 8px;">
          <h2 style="color: #4F8EF7;">Password Reset Request</h2>
          <p>You requested a password reset. Use the OTP code below to set a new password:</p>
          <div style="background-color: #f5f8fa; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; border-radius: 4px; color: #0A0F1E; border: 1px solid #1E2A3A;">
            ${otpCode}
          </div>
          <p style="color: #8899a6; font-size: 12px; margin-top: 20px;">This OTP is valid for 10 minutes. If you did not make this request, please ignore this email.</p>
        </div>
      `,
    });

    return sendResponse(res, 200, true, 'OTP sent to email successfully');
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return sendResponse(res, 404, false, 'User not found');
    }

    if (!user.otp || !user.otp.code || user.otp.code !== otp) {
      return sendResponse(res, 400, false, 'Invalid OTP');
    }

    if (new Date() > user.otp.expiresAt) {
      return sendResponse(res, 400, false, 'OTP has expired');
    }

    // Set new password
    user.passwordHash = newPassword; // Will be hashed in pre-save hook
    user.otp = undefined; // Clear OTP fields
    await user.save();

    return sendResponse(res, 200, true, 'Password reset successfully');
  } catch (error) {
    next(error);
  }
};
