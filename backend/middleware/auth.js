const jwt = require('jsonwebtoken');
const MemoryUser = require('../models/MemoryUser');
const userStore = require('../models/UserStore');
const users = require('../models/User')

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = authHeader?.replace('Bearer ', '') || req.header('x-auth-token');

    if (!token || token === 'null' || token === 'undefined') {
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    // Check if token looks like a JWT (has 3 parts separated by dots)
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.error('❌ Auth middleware error: jwt malformed - token does not have 3 parts');
      return res.status(401).json({ error: 'Token is malformed' });
    }

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    console.log('🔍 Token decoded:', decoded);

    // Get user from the decoded token using singleton UserStore
    const user = await users.findById(decoded.userId);
    console.log("DEBUG",user)
    
    if (!user) {
      console.log('❌ User not found for token:', decoded.userId);
      console.log('🔍 Available users in store:', userStore.getUserCount());
      console.log('🔍 Available user IDs:', userStore.getAllUsers().map(u => u._id));
      return res.status(401).json({ error: 'User not found' });
    }

    console.log('✅ Auth middleware: User authenticated:', user.email);
    req.user = user;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.message);
    
    // Provide more specific error messages
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token is malformed' });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired' });
    } else {
      return res.status(401).json({ error: 'Token is not valid' });
    }
  }
};

module.exports = authMiddleware;
