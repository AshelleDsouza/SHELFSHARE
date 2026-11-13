const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');
const { testConnection } = require('./config/db');
const { initializeDatabase } = require('./utils/initDatabase');

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
const configuredOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((url) => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

const allowedOrigins = [...new Set([...configuredOrigins, ...defaultOrigins])];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.replace(/\/+$/, '');

      // Direct match in allowed list
      if (allowedOrigins.includes(cleanOrigin)) {
        return callback(null, true);
      }

      // Allow any Vercel preview deployment for this project if on Vercel
      if (
        process.env.ALLOW_ALL_VERCEL_PREVIEWS === 'true' ||
        process.env.VERCEL ||
        cleanOrigin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }

      return callback(new Error(`Blocked by CORS policy for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Disposition'],
  })
);

// Handle preflight OPTIONS requests across all routes
app.options('*', cors());

// Body and Cookie Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'shelfshare_cookie_secret_key_2026'));

// Root Endpoint - Identifies API and directs to documentation and health
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    name: 'ShelfShare – Student Academic Resource Sharing API',
    tagline: 'Learn. Share. Grow.',
    status: 'operational',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      api_health: '/api/health',
      public_stats: '/api/public/stats',
      resources: '/api/resources',
      auth: '/api/auth',
    },
  });
});

// Dynamic Health Check Handlers (Safe MySQL Probe)
const healthHandler = async (req, res) => {
  const dbStatus = await testConnection();
  const statusCode = dbStatus.connected ? 200 : 503;
  res.status(statusCode).json({
    status: dbStatus.connected ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    service: 'ShelfShare REST API',
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus.connected ? 'connected' : 'disconnected',
      message: dbStatus.message,
      target: dbStatus.database,
    },
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

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
  if (process.env.AUTO_INIT_DB !== 'false') {
    initializeDatabase().catch((err) => console.warn('[Auto DB Init Notice]', err.message));
  }
  return app.listen(PORT, () => {
    console.log(`[Server] ShelfShare API running on http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = app;
