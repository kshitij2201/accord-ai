// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../controllers/authController');
const { sendMessage, getChatHistory } = require('../controllers/chatController');

// Public route for anonymous
router.post('/send-anonymous', sendMessage);

// Protected route
router.post('/send', verifyToken, sendMessage);
router.get('/history', verifyToken, getChatHistory);

module.exports = router;
