const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Dataset = require('../models/Dataset');

const migrateToDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/accord-ai');
    console.log('✅ Connected to MongoDB');

    // Read existing JSON dataset
    const jsonPath = path.join(__dirname, '../data/custom-dataset.json');
    
    let jsonData = {};
    try {
      const data = await fs.readFile(jsonPath, 'utf8');
      jsonData = JSON.parse(data);
      console.log('✅ JSON dataset loaded');
    } catch (error) {
      console.log('⚠️ No existing JSON dataset found, creating sample data');
      jsonData = {
        greetings: {
          "hello": "Hello! How can I help you today?",
          "hi": "Hi there! What can I do for you?",
          "good morning": "Good morning! Ready to start the day?"
        },
        technical: {
          "what is javascript": "JavaScript is a versatile programming language primarily used for web development.",
          "what is react": "React is a popular JavaScript library for building user interfaces."
        },
        fallback: {
          "default": "I don't have an answer for that right now, but I'm always learning!"
        }
      };
    }

    // Clear existing dataset (optional - remove this if you want to keep existing data)
    console.log('🗑️ Clearing existing dataset...');
    await Dataset.deleteMany({});

    let totalImported = 0;
    let totalErrors = 0;

    // Import each category
    for (const [category, responses] of Object.entries(jsonData)) {
      console.log(`\n📂 Processing category: ${category}`);
      
      if (typeof responses !== 'object') continue;

      for (const [key, response] of Object.entries(responses)) {
        try {
          const dataset = new Dataset({
            category: category.toLowerCase(),
            key: key.toLowerCase(),
            response: response,
            metadata: {
              confidence: 1.0,
              priority: category === 'fallback' ? -1 : 0
            }
          });

          await dataset.save();
          totalImported++;
          console.log(`  ✅ ${key}`);
        } catch (error) {
          totalErrors++;
          console.log(`  ❌ ${key}: ${error.message}`);
        }
      }
    }

    // Show statistics
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully imported: ${totalImported} responses`);
    console.log(`❌ Errors: ${totalErrors} responses`);

    // Get final stats
    const stats = await Dataset.getStats();
    console.log('\n📈 Database Statistics:');
    console.log(`Total Responses: ${stats.totalResponses}`);
    console.log(`Total Categories: ${stats.totalCategories}`);
    
    if (stats.categoryStats) {
      console.log('\nCategory Breakdown:');
      stats.categoryStats.forEach(cat => {
        console.log(`  ${cat.category}: ${cat.count} responses`);
      });
    }

    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
};

// Add sample data function
const addSampleData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/accord-ai');
    console.log('✅ Connected to MongoDB');

    const sampleData = {
      greetings: {
        "hello": "Hello! I'm your AI assistant. How can I help you today?",
        "hi": "Hi there! What can I do for you?",
        "hey": "Hey! I'm here to help. What's on your mind?",
        "good morning": "Good morning! Ready to tackle the day together?",
        "good afternoon": "Good afternoon! How's your day going?",
        "good evening": "Good evening! How can I assist you tonight?",
        "namaste": "Namaste! 🙏 How may I assist you today?"
      },
      questions: {
        "how are you": "I'm doing great, thank you for asking! I'm here and ready to help you with anything you need.",
        "what can you do": "I can help you with a wide variety of tasks including answering questions, providing information, helping with analysis, creative writing, problem-solving, and much more!",
        "who are you": "I'm your AI assistant, designed to help you with various tasks and answer your questions.",
        "what is your name": "I'm your AI assistant. You can call me whatever you'd like!",
        "tell me about yourself": "I'm an AI assistant created to help users with various tasks, answer questions, and provide useful information. I'm here to make your life easier!"
      },
      technical: {
        "what is javascript": "JavaScript is a versatile programming language primarily used for web development. It enables interactive web pages and is an essential part of web applications.",
        "what is python": "Python is a high-level, interpreted programming language known for its simple syntax and readability. It's widely used in web development, data science, AI, and automation.",
        "what is react": "React is a popular JavaScript library for building user interfaces, particularly web applications. It was developed by Facebook and uses a component-based architecture.",
        "what is nodejs": "Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine. It allows you to run JavaScript on the server side, enabling full-stack JavaScript development.",
        "what is mongodb": "MongoDB is a popular NoSQL database that stores data in flexible, JSON-like documents. It's designed for scalability and developer productivity.",
        "what is api": "An API (Application Programming Interface) is a set of protocols and tools for building software applications. It specifies how software components should interact."
      },
      general: {
        "thank you": "You're very welcome! I'm glad I could help. Is there anything else you'd like to know?",
        "thanks": "You're welcome! Happy to help anytime.",
        "bye": "Goodbye! Feel free to come back anytime you need assistance.",
        "goodbye": "Goodbye! It was great chatting with you. Take care!",
        "help": "I'm here to help! You can ask me questions about various topics, request explanations, get assistance with problems, or just have a conversation. What would you like to know?",
        "what time is it": "I don't have access to real-time data, but you can check the time on your device. Is there something time-related I can help you with?",
        "weather": "I don't have access to current weather data, but I'd recommend checking a weather app or website for the most accurate forecast in your area."
      },
      hindi: {
        "kya haal hai": "Sab badhiya hai! Aap kaise hain? Main aapki kya madad kar sakta hun?",
        "namaste": "Namaste! 🙏 Aaj main aapki kaise seva kar sakta hun?",
        "dhanyawad": "Aapka swagat hai! Khushi hui madad karke. Kuch aur chahiye?",
        "alvida": "Alvida! Jab bhi zarurat ho, aa jaiyega. Khush rahiye!"
      },
      fallback: {
        "default": "That's an interesting question! While I don't have a specific answer in my current dataset, I'm always learning. Could you rephrase your question or ask something else I might be able to help with?",
        "unclear": "I'm not quite sure what you're asking. Could you please rephrase your question or provide more details?",
        "no_match": "I don't have information about that specific topic in my current knowledge base. Is there something else I can help you with?"
      }
    };

    let totalImported = 0;
    let totalErrors = 0;

    for (const [category, responses] of Object.entries(sampleData)) {
      console.log(`\n📂 Adding ${category} responses...`);
      
      for (const [key, response] of Object.entries(responses)) {
        try {
          const dataset = new Dataset({
            category: category.toLowerCase(),
            key: key.toLowerCase(),
            response: response,
            metadata: {
              confidence: 1.0,
              priority: category === 'fallback' ? -1 : 0
            }
          });

          await dataset.save();
          totalImported++;
          console.log(`  ✅ ${key}`);
        } catch (error) {
          if (error.code === 11000) {
            console.log(`  ⚠️ ${key} (already exists)`);
          } else {
            totalErrors++;
            console.log(`  ❌ ${key}: ${error.message}`);
          }
        }
      }
    }

    console.log(`\n🎉 Sample data added! Imported: ${totalImported}, Errors: ${totalErrors}`);
    
  } catch (error) {
    console.error('❌ Error adding sample data:', error);
  } finally {
    await mongoose.disconnect();
  }
};

// Main function
const main = async () => {
  const args = process.argv.slice(2);
  
  if (args.includes('--sample')) {
    await addSampleData();
  } else {
    await migrateToDatabase();
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { migrateToDatabase, addSampleData };