// Simple test API endpoint for Vercel
module.exports = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Hello from Vercel API!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
};