const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/properties');
const customerRoutes = require('./routes/customers');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Rate limiting with environment variables
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "http://localhost:3000", "http://localhost:5173"],
      connectSrc: ["'self'", "http://localhost:3000", "http://localhost:5173"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"],
    },
  },
}));

// CORS configuration with environment variables
const getAllowedOrigins = () => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS;

  if (!allowedOrigins || allowedOrigins === '*') {
    return true; // Allow all origins in development
  }

  return allowedOrigins.split(',').map(origin => origin.trim());
};

const corsOptions = {
  origin: getAllowedOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Serve static files from uploads directory (completely bypass rate limiting)
app.use('/uploads', (req, res, next) => {
  // Add CORS headers for static files
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  // Add cache headers to reduce repeated requests
  res.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
  res.header('ETag', req.url); // Simple ETag based on URL
  next();
}, express.static('uploads', {
  // Add static file options to improve caching
  maxAge: '1h',
  etag: true,
  lastModified: true
}));

app.use(morgan('combined'));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Nibret Express API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/accounts', authRoutes);
app.use('/properties', propertyRoutes);
app.use('/customers', customerRoutes);
app.use('/analytics', require('./routes/analytics'));
app.use('/leads', require('./routes/leads'));
app.use('/upload', require('./routes/upload'));

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Nibret Express API server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 CORS Origins: ${process.env.ALLOWED_ORIGINS || 'All origins allowed'}`);
  console.log(`⚡ Rate Limit: ${process.env.RATE_LIMIT_MAX_REQUESTS || 100} requests per ${(parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 60000} minutes`);
  console.log(`☁️  Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? 'Configured' : 'Not configured'}`);
});

module.exports = app;
