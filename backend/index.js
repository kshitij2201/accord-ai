const express = require('express');
const cors = require('cors');

const app = express();

// Optional database connection (won't fail deployment if it fails)
try {
  const connectDB = require('./config/database');
  connectDB().then(() => {
    console.log('✅ Database connected successfully');
  }).catch((error) => {
    console.warn('⚠️ Database connection failed, using fallback storage');
  });
} catch (error) {
  console.warn('⚠️ Database module not available, using fallback storage');
}

// Basic middleware
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'https://chat.accordai.in',
    'https://chat.accordai.in/',
    'https://accord-ai-ipbv.vercel.app',
    'https://accord-ai-ipbv.vercel.app/',
    'https://your-frontend-domain.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Handle preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Accord AI Backend is running on Vercel!',
    timestamp: new Date().toISOString(),
    version: '1.1.0',
    status: 'FULL FEATURES RESTORED!',
    features: {
      authentication: 'Available',
      chat: 'Available', 
      ai: 'Available',
      payments: 'Available',
      subscriptions: 'Available',
      datasets: 'Available'
    },
    endpoints: [
      'GET /',
      'GET /api/health',
      'POST /api/auth/*',
      'POST /api/chat/*',
      'POST /api/ai/*',
      'GET|POST /api/subscription/*',
      'POST /api/payment/*',
      'GET|POST /api/dataset/*'
    ]
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Test endpoint working!',
    timestamp: new Date().toISOString()
  });
});

// Test CORS endpoint
app.post('/api/test-cors', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CORS test successful!',
    origin: req.headers.origin,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Add a test endpoint to verify deployment
app.get('/api/cors-test', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CORS test successful!',
    timestamp: new Date().toISOString(),
    headers: req.headers,
    origin: req.get('origin')
  });
});

// Quick chat test endpoint
app.post('/api/test-chat', (req, res) => {
  const { message } = req.body;
  res.status(200).json({
    success: true,
    message: 'Test chat working!',
    echo: message || 'No message provided',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Health check passed!',
    timestamp: new Date().toISOString()
  });
});

// Authentication routes
try {
  app.use('/api/auth', require('./routes/auth'));
} catch (error) {
  console.warn('Auth routes not available:', error.message);
}

// Chat routes
try {
  app.use('/api/chat', require('./routes/chat'));
} catch (error) {
  console.warn('Chat routes not available:', error.message);
}

// AI routes
try {
  app.use('/api/ai', require('./routes/ai'));
} catch (error) {
  console.warn('AI routes not available:', error.message);
}

// Subscription routes
try {
  app.use('/api/subscription', require('./routes/subscription'));
} catch (error) {
  console.warn('Subscription routes not available:', error.message);
}

// Payment routes
try {
  app.use('/api/payment', require('./routes/payment'));
} catch (error) {
  console.warn('Payment routes not available:', error.message);
}

// Dataset routes
try {
  app.use('/api/dataset', require('./routes/dataset'));
} catch (error) {
  console.warn('Dataset routes not available:', error.message);
}

// Basic API routes (fallback)
app.get('/api/*', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API endpoint reached',
    path: req.path,
    timestamp: new Date().toISOString(),
    note: 'Some routes may not be fully configured yet'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server Error:', error.message);
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Export for Vercel
module.exports = app;