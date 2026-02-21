const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const attendanceRoutes = require('./routes/attendance');
const overtimeRoutes = require('./routes/overtime');
const advanceRoutes = require('./routes/advances');
const payrollRoutes = require('./routes/payroll-new');
const businessRoutes = require('./routes/business');
const productRoutes = require('./routes/products');
const cashbookRoutes = require('./routes/cashbook');
const insuranceRoutes = require('./routes/insurance');

const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
// CORS configuration - Allow dynamic origins for sharing
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (process.env.NODE_ENV === 'production') {
      // In production, allow Render domains and specific frontend domains
      const allowedOrigins = [
        process.env.FRONTEND_URL || 'https://your-production-domain.com',
        'https://vercel.app',
        /\.vercel\.app$/,
        // Allow Render domains
        /\.onrender\.com$/,
        'https://render.com',
        // Allow mobile apps (Capacitor)
        'capacitor://localhost',
        'http://localhost',
        'ionic://localhost'
      ];
      
      // Check if origin is allowed
      const isAllowed = allowedOrigins.some(allowedOrigin => {
        if (allowedOrigin instanceof RegExp) {
          return allowedOrigin.test(origin);
        }
        return allowedOrigin === origin;
      });
      
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // In development, allow all origins for easy sharing
      console.log('🌍 Allowing origin:', origin);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Platform'],
  exposedHeaders: ['X-Platform']
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // increased limit for development
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../build')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/overtime', overtimeRoutes);
app.use('/api/advances', advanceRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cashbook', cashbookRoutes);
app.use('/api/insurance', insuranceRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    server_url: `${req.protocol}://${req.get('host')}`,
    frontend_url: `${req.protocol}://${req.get('host')}`
  });
});

// SPA routing fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  // Don't intercept API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  
  // Serve index.html for all other routes (SPA routing)
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
