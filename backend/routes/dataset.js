const express = require('express');
const router = express.Router();
const datasetController = require('../controllers/datasetController');
const { verifyToken } = require('../controllers/authController');

// Get dataset statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await datasetController.getStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting dataset stats',
      error: error.message
    });
  }
});

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await datasetController.getCategories();
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting categories',
      error: error.message
    });
  }
});

// Get responses in a specific category
router.get('/category/:categoryName', async (req, res) => {
  try {
    const { categoryName } = req.params;
    const responses = await datasetController.getCategory(categoryName);
    res.json({
      success: true,
      category: categoryName,
      responses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting category responses',
      error: error.message
    });
  }
});

// Test a message against the dataset
router.post('/test', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    const match = await datasetController.findResponse(message);
    
    res.json({
      success: true,
      query: message,
      match: match || null,
      hasMatch: !!match
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error testing message',
      error: error.message
    });
  }
});

// Search responses
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const results = await datasetController.searchResponses(q, parseInt(limit));
    
    res.json({
      success: true,
      query: q,
      results,
      count: results.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching responses',
      error: error.message
    });
  }
});

// Admin check middleware
const verifyAdmin = async (req, res, next) => {
  try {
    // Check if user is admin (you can modify this logic as needed)
    const adminEmails = ['admin@accordai.com', 'your-admin-email@example.com'];
    
    if (!req.user || !adminEmails.includes(req.user.email)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error verifying admin privileges',
      error: error.message
    });
  }
};

// Protected routes (require authentication + admin privileges)

// Add new response
router.post('/add', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { category, key, response } = req.body;
    const userId = req.user?.id;
    
    if (!category || !key || !response) {
      return res.status(400).json({
        success: false,
        message: 'Category, key, and response are required'
      });
    }

    const success = await datasetController.addResponse(category, key, response, userId);
    
    if (success) {
      res.json({
        success: true,
        message: 'Response added successfully',
        category,
        key,
        response
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to add response (may already exist)'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding response',
      error: error.message
    });
  }
});

// Update existing response
router.put('/update', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { category, key, newResponse } = req.body;
    const userId = req.user?.id;
    
    if (!category || !key || !newResponse) {
      return res.status(400).json({
        success: false,
        message: 'Category, key, and newResponse are required'
      });
    }

    const success = await datasetController.updateResponse(category, key, newResponse, userId);
    
    if (success) {
      res.json({
        success: true,
        message: 'Response updated successfully',
        category,
        key,
        newResponse
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Response not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating response',
      error: error.message
    });
  }
});

// Delete response
router.delete('/delete', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { category, key } = req.body;
    
    if (!category || !key) {
      return res.status(400).json({
        success: false,
        message: 'Category and key are required'
      });
    }

    const success = await datasetController.deleteResponse(category, key);
    
    if (success) {
      res.json({
        success: true,
        message: 'Response deleted successfully',
        category,
        key
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Response not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting response',
      error: error.message
    });
  }
});

// Bulk import responses
router.post('/import', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { responses } = req.body;
    const userId = req.user?.id;
    
    if (!responses || typeof responses !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Responses object is required'
      });
    }

    const result = await datasetController.bulkImport(responses, userId);

    res.json({
      success: true,
      message: `Import completed: ${result.successCount} successful, ${result.errorCount} failed`,
      successCount: result.successCount,
      errorCount: result.errorCount,
      errors: result.errors.length > 0 ? result.errors : undefined
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error importing responses',
      error: error.message
    });
  }
});

module.exports = router;