const express = require('express');
const cors = require('cors');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Accord AI Backend is running on Vercel!',
    timestamp: new Date().toISOString(),
    version: '1.0.3',
    status: 'MINIMAL SETUP - SHOULD WORK!'
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Health check passed!',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Export for Vercel
module.exports = app;