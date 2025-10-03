// Simple test endpoint for Vercel deployment
const express = require('express');
const app = express();

app.use(express.json());

// Test endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Accord AI Backend is working on Vercel!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API test endpoint working!',
    timestamp: new Date().toISOString()
  });
});

// Export for Vercel
module.exports = app;