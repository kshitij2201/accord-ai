const User = require('../models/User');
const { db } = require('../config/firebase');

// Send message with daily limit check
const sendMessage = async (req, res) => {
  try {
    const { firebaseUid, message, isAnonymous = false } = req.body;

    // 1. Anonymous users - unlimited usage
    if (isAnonymous || !firebaseUid) {
      return res.status(200).json({
        success: true,
        message: 'Anonymous message processed - unlimited usage',
        requiresAuth: false
      });
    }

    // 2. Find user in DB
    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const now = new Date();
    const today = now.toISOString().split("T")[0]; // e.g. "2025-09-21"
    const lastMessageDate = user.lastMessageDate
      ? user.lastMessageDate.toISOString().split("T")[0]
      : null;

    // 3. Reset count if new day
    if (lastMessageDate !== today) {
      user.dailyMessageCount = 0;
      user.lastMessageDate = now;
    }

    // 4. Premium users = unlimited
    if (user.isPremium) {
      user.dailyMessageCount += 1;
      user.lastMessageDate = now;
      await user.save();

      await db.ref(`chats/${firebaseUid}`).push({
        message,
        timestamp: now.toISOString(),
        dailyMessageCount: user.dailyMessageCount
      });

      return res.status(200).json({
        success: true,
        message: 'Message sent successfully',
        isPremium: true,
        dailyMessageCount: user.dailyMessageCount
      });
    }

    // 5. Free users = 10 messages/day limit
    if (user.dailyMessageCount >= 10) {
      return res.status(403).json({
        success: false,
        message: 'Daily limit reached (10 messages). Upgrade to premium for unlimited usage.',
        dailyMessageCount: user.dailyMessageCount,
        limitReached: true
      });
    }

    // 6. Allow message if under limit
    user.dailyMessageCount += 1;
    user.lastMessageDate = now;
    await user.save();

    await db.ref(`chats/${firebaseUid}`).push({
      message,
      timestamp: now.toISOString(),
      dailyMessageCount: user.dailyMessageCount
    });

    return res.status(200).json({
      success: true,
      message: 'Message sent successfully',
      dailyMessageCount: user.dailyMessageCount,
      limitReached: false
    });

  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
};

// Fetch chat history (optional)
const getChatHistory = async (req, res) => {
  try {
    const { firebaseUid } = req.query;

    if (!firebaseUid) {
      return res.status(400).json({
        success: false,
        message: 'Firebase UID is required'
      });
    }

    const snapshot = await db.ref(`chats/${firebaseUid}`).once('value');
    const chats = snapshot.val() || {};

    return res.status(200).json({
      success: true,
      chats
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch chat history',
      error: error.message
    });
  }
};

module.exports = {
  sendMessage,
  getChatHistory
};
