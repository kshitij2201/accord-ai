const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const checkMongoDB = async () => {
  console.log('🔍 Checking MongoDB Connection...\n');
  
  const mongoUri = process.env.MONGODB_URI;
  console.log('📍 MongoDB URI:', mongoUri);
  
  if (!mongoUri) {
    console.log('❌ MongoDB URI not found in environment variables');
    return false;
  }

  try {
    console.log('🔗 Attempting to connect to MongoDB...');
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // 5 second timeout
    });
    
    console.log('✅ MongoDB connection successful!');
    
    // Test database operations
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('📊 Available collections:');
    collections.forEach(collection => {
      console.log(`   - ${collection.name}`);
    });
    
    // Check if Dataset collection exists and has data
    const Dataset = require('../models/Dataset');
    const datasetCount = await Dataset.countDocuments();
    console.log(`\n📚 Dataset records: ${datasetCount}`);
    
    if (datasetCount === 0) {
      console.log('⚠️ No dataset records found. You may need to run migration script.');
    } else {
      console.log('✅ Dataset records found in database');
      
      // Show some sample data
      const sampleData = await Dataset.find().limit(5);
      console.log('\n📝 Sample dataset entries:');
      sampleData.forEach(item => {
        console.log(`   ${item.category}/${item.key}: "${item.response.substring(0, 50)}..."`);
      });
    }
    
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    return true;
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('   1. Make sure MongoDB is installed and running');
      console.log('   2. Check if MongoDB service is started');
      console.log('   3. Verify the connection string in .env file');
      console.log('   4. For Windows: Start MongoDB service or run mongod.exe');
      console.log('   5. For Mac: brew services start mongodb-community');
      console.log('   6. For Linux: sudo systemctl start mongod');
    }
    
    return false;
  }
};

const installMongoDB = () => {
  console.log('\n📦 MongoDB Installation Guide:\n');
  
  console.log('🪟 Windows:');
  console.log('   1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community');
  console.log('   2. Run the installer and follow the setup wizard');
  console.log('   3. Install as a Windows Service (recommended)');
  console.log('   4. MongoDB will start automatically');
  
  console.log('\n🍎 macOS:');
  console.log('   1. Install Homebrew if not already installed');
  console.log('   2. Run: brew tap mongodb/brew');
  console.log('   3. Run: brew install mongodb-community');
  console.log('   4. Start: brew services start mongodb-community');
  
  console.log('\n🐧 Linux (Ubuntu/Debian):');
  console.log('   1. Import MongoDB public GPG key');
  console.log('   2. Add MongoDB repository');
  console.log('   3. Run: sudo apt update && sudo apt install mongodb-org');
  console.log('   4. Start: sudo systemctl start mongod');
  
  console.log('\n🐳 Docker (All platforms):');
  console.log('   1. Run: docker run -d -p 27017:27017 --name mongodb mongo:latest');
  console.log('   2. MongoDB will be available at mongodb://localhost:27017');
};

const main = async () => {
  const isConnected = await checkMongoDB();
  
  if (!isConnected) {
    installMongoDB();
  }
};

if (require.main === module) {
  main();
}

module.exports = { checkMongoDB };