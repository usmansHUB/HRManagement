require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const compression = require('compression');
const connectDB = require('./config/db');
const initCronJobs = require('./jobs/cronJobs');
const errorHandler = require('./middleware/errorHandler');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const recruitmentRoutes = require('./routes/recruitmentRoutes');
const performanceRoutes = require('./routes/performanceRoutes');
const lndRoutes = require('./routes/lndRoutes');
const reportRoutes = require('./routes/reportRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

// Initialize app
const app = express();
const PORT = process.env.PORT || 5000;

// Enable gzip compression for all routes
app.use(compression());

// Connect to Database
connectDB();

// Initialize Cron Jobs
initCronJobs();

// Security & Logging Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false, // Allows loading locally uploaded assets on frontend
}));

// CORS Configuration
app.use(cors({
  origin: true, // Allow all origins for dev simplicity, or configure specific frontend URL
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Custom Inline Cookie Parser (Avoids external cookie-parser dependency)
app.use((req, res, next) => {
  req.cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      const name = parts.shift().trim();
      const value = parts.join('=').trim();
      try {
        req.cookies[name] = decodeURIComponent(value);
      } catch (err) {
        req.cookies[name] = value; // fallback to raw string if malformed URL encoding
      }
    });
  }
  next();
});

// Static Uploads Folder Serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/lnd', lndRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ success: true, message: 'HRM API Server Running' });
});

// Centralized Error Middleware
app.use(errorHandler);

// Start listening
app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
