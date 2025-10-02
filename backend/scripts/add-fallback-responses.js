const mongoose = require('mongoose');
require('dotenv').config();

const Dataset = require('../models/Dataset');

const fallbackResponses = {
  fallback: {
    "default": "I don't have an answer for that right now. Could you try asking something else?",
    "hindi_default": "Maaf kijiye, mere paas is sawal ka jawab nahi hai. Kya aap kuch aur puch sakte hain?",
    "urdu_default": "Maaf kijiye, mere paas is sawal ka jawab nahi hai. Kya aap kuch aur pooch sakte hain?",
    "unclear": "I'm not quite sure what you're asking. Could you please rephrase your question?",
    "hindi_unclear": "Main samjha nahi ki aap kya puch rahe hain. Kya aap apna sawal dusre tarike se puch sakte hain?",
    "no_match": "I don't have information about that specific topic. Is there something else I can help you with?",
    "hindi_no_match": "Mere paas is topic ki jankari nahi hai. Kya main kisi aur cheez mein madad kar sakta hun?"
  },
  
  common_responses: {
    "samjha nahi": "Koi baat nahi! Main samjhane ki koshish karta hun. Kya aap thoda aur detail mein bata sakte hain?",
    "samajh nahi aaya": "Theek hai, main aur simple tarike se samjhata hun. Kya specific problem hai?",
    "hindi mein bolo": "Bilkul! Main Hindi mein baat kar sakta hun. Kya sawal hai?",
    "english mein bolo": "Sure! I can speak in English. What would you like to know?",
    "koi language": "Main kai languages mein baat kar sakta hun - Hindi, English, Urdu, Punjabi, Bengali, Tamil, Telugu, Gujarati, Marathi, Kannada, Malayalam. Kaunsi language prefer karenge?",
    "which language": "I can communicate in multiple languages including Hindi, English, Urdu, Punjabi, Bengali, Tamil, Telugu, Gujarati, Marathi, Kannada, and Malayalam. Which language would you prefer?",
    "language change": "Aap jo bhi language mein baat karna chahte hain, main us mein jawab de sakta hun. Bas apni language mein sawal puchiye!",
    "translate": "Main translation mein madad kar sakta hun. Kya translate karna hai?",
    "meaning": "Matlab puchna chahte hain? Batayiye kiska matlab chahiye?",
    "explain": "Bilkul! Main explain kar sakta hun. Kya explain karna hai?"
  }
};

const addFallbackResponses = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/accord-ai');
    console.log('✅ Connected to MongoDB');

    let totalImported = 0;
    let totalErrors = 0;

    for (const [category, responses] of Object.entries(fallbackResponses)) {
      console.log(`\n📂 Adding ${category} responses...`);
      
      for (const [key, response] of Object.entries(responses)) {
        try {
          const dataset = new Dataset({
            category: category.toLowerCase(),
            key: key.toLowerCase(),
            response: response,
            metadata: {
              confidence: 1.0,
              priority: category === 'fallback' ? -1 : 0,
              tags: ['multilingual', 'fallback', 'common']
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

    console.log(`\n🎉 Fallback responses added!`);
    console.log(`✅ Successfully imported: ${totalImported} responses`);
    console.log(`❌ Errors: ${totalErrors} responses`);

    // Show final stats
    const stats = await Dataset.getStats();
    console.log(`\n📈 Total in database: ${stats.totalResponses} responses`);

  } catch (error) {
    console.error('❌ Error adding fallback responses:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
};

// Run if called directly
if (require.main === module) {
  addFallbackResponses();
}

module.exports = { addFallbackResponses };