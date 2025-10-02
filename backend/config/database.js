const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      const conn = await mongoose.connect(process.env.MONGODB_URI);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } else {
      console.log('📝 MongoDB URI not provided, running without database persistence');
    }
  } catch (error) {
    console.error('⚠️ Database connection error:', error.message);
    console.log('🔄 Continuing without database connection...');
    // Don't exit, just continue without database
  }
};

module.exports = connectDB;
