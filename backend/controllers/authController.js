const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');

// Try to use MongoDB User model, fallback to memory store
let User, userStore, isUsingMongoDB = false;

const initializeUserModel = () => {
  try {
    if (mongoose.connection.readyState === 1) {
      User = require('../models/User');
      isUsingMongoDB = true;
      console.log('✅ Using MongoDB for user storage');
    } else {
      throw new Error('MongoDB not connected');
    }
  } catch (error) {
    console.log('📝 Using in-memory user storage (MongoDB not available)');
    User = require('../models/MemoryUser');
    userStore = require('../models/MemoryUser').userStore;
    isUsingMongoDB = false;
    
    // Ensure we're using the same instance
    console.log('🔍 Memory store initialized with', userStore.users.size, 'existing users');
  }
};

// Initialize on startup
initializeUserModel();

// Re-initialize when MongoDB connects
mongoose.connection.on('connected', () => {
  console.log('🔄 MongoDB connected, switching to database storage');
  initializeUserModel();
});

mongoose.connection.on('disconnected', () => {
  console.log('🔄 MongoDB disconnected, switching to memory storage');
  initializeUserModel();
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Email configuration
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASSWORD || 'your-app-password'
    }
  });
};

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Verify JWT Token Middleware
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('🔍 Token decoded:', { userId: decoded.userId });
    
    const user = await User.findById(decoded.userId);
    console.log('🔍 User lookup result:', { found: !!user, userId: decoded.userId });
    
    if (!user) {
      console.error('❌ User not found for token:', decoded.userId);
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

// Register new user
const registerUser = async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    // Validate input
    if (!email || !password || !displayName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password, and display name'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const userData = {
      email: email.toLowerCase(),
      password: hashedPassword,
      displayName,
      provider: 'email',
      isEmailVerified: false,
      emailVerificationToken: crypto.randomBytes(32).toString('hex'),
      lastActiveTime: new Date()
    };

    const user = await User.create(userData);
    console.log('🔍 User created during registration:', { id: user._id, email: user.email });

    // Verify user was saved by trying to find it immediately
    const verifyUser = await User.findById(user._id);
    console.log('🔍 User verification after creation:', verifyUser ? 'Found' : 'NOT FOUND');

    // Generate JWT token
    const token = generateToken(user._id);
    console.log('🔍 Generated token for user ID:', user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email for verification.',
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        isPremium: user.isPremium || false,
        messageCount: user.messageCount || 0,
        isEmailVerified: user.isEmailVerified
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last active time
    user.lastActiveTime = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        isPremium: user.isPremium || false,
        messageCount: user.messageCount || 0,
        isEmailVerified: user.isEmailVerified
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Google OAuth
const googleAuth = async (req, res) => {
  try {
    const { email, displayName, photoURL, googleId } = req.body;

    // Find or create user
    let user = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { googleId }
      ]
    });

    if (!user) {
      // Create new user
      const userData = {
        email: email.toLowerCase(),
        displayName,
        photoURL,
        googleId,
        provider: 'google',
        isEmailVerified: true,
        lastActiveTime: new Date()
      };
      
      console.log('🔍 Creating new user with data:', userData);
      
      // Check if using MongoDB User model or MemoryUser model
      if (User.create) {
        user = await User.create(userData);
      } else {
        // For MemoryUser, use the static create method
        user = await User.create(userData);
      }
      
      console.log('🔍 Created user:', { id: user._id, email: user.email });
    } else {
      // Update existing user
      user.lastActiveTime = new Date();
      if (!user.googleId) user.googleId = googleId;
      if (!user.photoURL) user.photoURL = photoURL;
      
      // For MemoryUser, we need to save through the store
      if (user.save) {
        await user.save();
      } else {
        // Fallback for MemoryUser - save manually
        await User.save ? User.save(user) : userStore.save(user);
      }
      console.log('🔍 Updated existing user:', { id: user._id, email: user.email });
    }

    // Generate JWT token
    console.log('🔍 Generating token for user ID:', user._id);
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        isPremium: user.isPremium || false,
        messageCount: user.messageCount || 0,
        isEmailVerified: user.isEmailVerified
      }
    });

  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Google authentication failed',
      error: error.message
    });
  }
};

// Request password reset
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email address'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal whether user exists or not for security
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, we have sent a password reset link.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetExpiry = resetTokenExpiry;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, we have sent a password reset link.'
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request'
    });
  }
};

// Reset password with token
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide reset token and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpiry: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    user.lastActiveTime = new Date();
    await user.save();

    // Generate new JWT token
    const jwtToken = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      token: jwtToken,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        isPremium: user.isPremium || false,
        messageCount: user.messageCount || 0,
        isEmailVerified: user.isEmailVerified
      }
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
};

// Verify token endpoint
const verifyTokenEndpoint = async (req, res) => {
  try {
    // Token verification is already done in middleware
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      user: {
        id: req.user._id,
        email: req.user.email,
        displayName: req.user.displayName,
        photoURL: req.user.photoURL,
        isPremium: req.user.isPremium || false,
        messageCount: req.user.messageCount || 0,
        isEmailVerified: req.user.isEmailVerified
      }
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Check trial status
const checkTrialStatus = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    // For anonymous/guest users
    if (!userId) {
      const trialStartTime = new Date();
      const trialEndTime = new Date(trialStartTime.getTime() + (parseInt(process.env.TRIAL_DURATION_MINUTES || '30') * 60 * 1000));
      
      return res.status(200).json({
        success: true,
        isTrialActive: true,
        trialStartTime,
        trialEndTime,
        remainingTime: parseInt(process.env.TRIAL_DURATION_MINUTES || '30') * 60 * 1000,
        messageCount: 0,
        maxMessages: parseInt(process.env.MAX_TRIAL_MESSAGES || '10')
      });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      isTrialActive: false,
      isPremium: user.isPremium || false,
      messageCount: user.messageCount || 0,
      maxMessages: parseInt(process.env.MAX_TRIAL_MESSAGES || '10')
    });

  } catch (error) {
    console.error('Trial status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check trial status',
      error: error.message
    });
  }
};

// Update user status
const updateUserStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.lastActiveTime = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User status updated'
    });

  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    });
  }
};

module.exports = {
  verifyToken,
  registerUser,
  loginUser,
  googleAuth,
  requestPasswordReset,
  resetPassword,
  verifyTokenEndpoint,
  checkTrialStatus,
  updateUserStatus
};
