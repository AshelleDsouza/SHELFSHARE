const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');
const { testConnection } = require('./config/db');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const academicRoutes = require('./routes/academicRoutes');
const publicRoutes = require('./routes/publicRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const downloadRoutes = require('./routes/downloadRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');
const collectionRoutes = require('./routes/collectionRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const userRoutes = require('./routes/userRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
  })
);

// Body and Cookie Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'shelfshare_cookie_secret_key_2026'));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'ShelfShare Backend API is running smoothly',
  });
});

// API Routes
app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/downloads', downloadRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);

// 404 Route Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  // Multer & File Validation Errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds the permitted limit of 10 MB.',
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  // Custom File Extension / Format Filter Errors
  if (err.message && (err.message.includes('Unsupported file extension') || err.message.includes('Unsupported MIME type'))) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  console.error('[Unhandled Error]', err.stack || err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred.',
  });
});

// Start Server only when executed directly (not when required by tests)
async function startServer() {
  await testConnection();
  return app.listen(PORT, () => {
    console.log(`[Server] ShelfShare API running on http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = app;
