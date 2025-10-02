const express = require('express');
const router = express.Router();
const { handleAIRequest, handlePDFRequest, handleFileRequest, upload } = require('../controllers/aiController');
const { verifyToken } = require('../controllers/authController');

// Public route for anonymous users (trial)
router.post('/chat-anonymous', handleAIRequest);

// Protected route for authenticated users
router.post('/chat', verifyToken, handleAIRequest);

// File upload routes (supports PDF, Word, Images)
router.post('/file-anonymous', upload.single('file'), handleFileRequest);
router.post('/file', verifyToken, upload.single('file'), handleFileRequest);

// Legacy PDF upload routes (for backward compatibility)
router.post('/pdf-anonymous', upload.single('pdf'), handlePDFRequest);
router.post('/pdf', verifyToken, upload.single('pdf'), handlePDFRequest);

module.exports = router;
