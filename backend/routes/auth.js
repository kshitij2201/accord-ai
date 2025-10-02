const express = require('express');
const router = express.Router();
const { 
  verifyToken, 
  registerUser,
  loginUser,
  googleAuth,
  requestPasswordReset,
  resetPassword,
  verifyTokenEndpoint,
  checkTrialStatus, 
  updateUserStatus 
} = require('../controllers/authController');

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuth);
router.post('/forgot-password', requestPasswordReset);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/verify-token', verifyToken, verifyTokenEndpoint);
router.get('/trial-status', verifyToken, checkTrialStatus);
router.put('/status', verifyToken, updateUserStatus);

module.exports = router;
