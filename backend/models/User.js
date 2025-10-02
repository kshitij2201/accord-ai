const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() {
      return this.provider === 'email';
    }
  },
  displayName: {
    type: String,
    required: true
  },
  photoURL: {
    type: String,
    default: null
  },
  provider: {
    type: String,
    enum: ['google', 'email'],
    required: true
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpiry: {
    type: Date,
    default: null
  },
  trialStartTime: {
    type: Date,
    default: null
  },
  trialEndTime: {
    type: Date,
    default: null
  },
  messageCount: {
    type: Number,
    default: 0
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  lastActiveTime: {
    type: Date,
    default: Date.now
  },
  chatSessions: [{
    sessionId: String,
    startTime: Date,
    endTime: Date,
    messageCount: Number
  }],

  // ✅ NEW FIELDS for daily message limit
  dailyMessageCount: {
    type: Number,
    default: 0
  },
  lastMessageDate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ firebaseUid: 1 });
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);
