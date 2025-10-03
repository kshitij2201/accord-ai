const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');

const app = express();

// Connect to MongoDB (optional for serverless)
connectDB().then(() => {
  console.log('✅ Database connection initialized');
}).catch((error) => {
  console.log('⚠️ Database connection failed, using fallback storage');
});

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175'
  ],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Accord AI Backend is running on Vercel!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    version: '1.0.2',
    deployedAt: '2025-10-03',
    commit: '64a071c',
    status: 'FIXED - Should work now!'
  });
});

// Add a test endpoint to verify deployment
app.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Test endpoint working!',
    deploymentTime: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/subscription', require('./routes/subscription'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/dataset', require('./routes/dataset'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Accord AI Backend is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('--- Express Error Handler ---');
  console.error('Error Message:', error.message);
  console.error('Stack:', error.stack);
  if (req) {
    console.error('Request URL:', req.originalUrl);
    console.error('Request Body:', req.body);
  }
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    error: error
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Export for Vercel (serverless)
module.exports = app;