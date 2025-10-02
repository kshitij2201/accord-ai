const Dataset = require('../models/Dataset');

class DatasetController {
  constructor() {
    console.log('✅ MongoDB-based Dataset Controller initialized');
  }

  // Detect language of user message
  detectLanguage(message) {
    const hindiPatterns = /[अ-ह]|kya|hai|main|aap|kaise|haan|nahi|dhanyawad|namaste|madad/i;
    const urduPatterns = /assalam|alaikum|adab|shukria|alvida|aap|kaise|madad/i;
    const punjabi = /sat sri akal|kiddan|tusi|kaun|chahidi/i;
    const bengali = /namaskar|kemon|achen|dhonnobad|apni|sahajyo/i;
    const tamil = /vanakkam|eppadi|irukkireenga|nandri|neenga|uthavi/i;
    const telugu = /ela unnaru|dhanyawadalu|meeru|evaru|sahayam/i;
    const gujarati = /kem cho|aabhar|aavjo|tame|madad joiye/i;
    const marathi = /kase aahat|tumhi kon|madad pahije/i;
    const kannada = /hegiddira|dhanyawadagalu|neevu yaaru|sahaya beku/i;
    const malayalam = /engane undu|ningal aaraanu|sahayam venam/i;

    if (hindiPatterns.test(message)) return 'hindi';
    if (urduPatterns.test(message)) return 'urdu';
    if (punjabi.test(message)) return 'punjabi';
    if (bengali.test(message)) return 'bengali';
    if (tamil.test(message)) return 'tamil';
    if (telugu.test(message)) return 'telugu';
    if (gujarati.test(message)) return 'gujarati';
    if (marathi.test(message)) return 'marathi';
    if (kannada.test(message)) return 'kannada';
    if (malayalam.test(message)) return 'malayalam';
    
    return 'english'; // Default to English
  }

  // Find best matching response from database with language awareness
  async findResponse(userMessage) {
    try {
      const message = userMessage.toLowerCase().trim();
      const detectedLanguage = this.detectLanguage(message);
      
      console.log(`🔍 Detected language: ${detectedLanguage} for message: "${message}"`);
      
      // First try exact match
      let exactMatch = await Dataset.findOne({
        key: message,
        isActive: true
      }).sort({ 'metadata.priority': -1, 'metadata.confidence': -1 });

      if (exactMatch) {
        // Increment usage count
        await exactMatch.incrementUsage();
        
        return {
          response: exactMatch.response,
          category: exactMatch.category,
          confidence: 1.0,
          matchType: 'exact',
          matchedKey: exactMatch.key,
          id: exactMatch._id,
          detectedLanguage
        };
      }

      // Try language-specific matches first
      const languageSpecificMatches = await Dataset.find({
        $and: [
          { isActive: true },
          {
            $or: [
              { category: detectedLanguage },
              { 'metadata.tags': detectedLanguage },
              { category: 'common_multilingual' },
              { category: 'technical_multilingual' }
            ]
          },
          {
            $or: [
              { key: { $regex: message, $options: 'i' } },
              { response: { $regex: message, $options: 'i' } }
            ]
          }
        ]
      }).sort({ 'metadata.priority': -1, 'metadata.confidence': -1 }).limit(15);

      // Try general partial matches if no language-specific matches
      const generalMatches = await Dataset.find({
        $and: [
          { isActive: true },
          {
            $or: [
              { key: { $regex: message, $options: 'i' } },
              { response: { $regex: message, $options: 'i' } }
            ]
          }
        ]
      }).sort({ 'metadata.priority': -1, 'metadata.confidence': -1 }).limit(20);

      // Combine and deduplicate matches
      const allMatches = [...languageSpecificMatches, ...generalMatches];
      const uniqueMatches = allMatches.filter((match, index, self) => 
        index === self.findIndex(m => m._id.toString() === match._id.toString())
      );

      let bestMatch = null;
      let bestScore = 0;

      for (const match of uniqueMatches) {
        let score = this.calculateSimilarity(message, match.key);
        
        // Boost score for language-specific matches
        if (match.category === detectedLanguage || 
            match.metadata.tags?.includes(detectedLanguage) ||
            match.category === 'common_multilingual' ||
            match.category === 'technical_multilingual') {
          score *= 1.2; // 20% boost for language relevance
        }
        
        if (score > bestScore && score > 0.5) { // Lower threshold for multilingual
          bestMatch = {
            response: match.response,
            category: match.category,
            confidence: Math.min(score, 1.0), // Cap at 1.0
            matchType: 'partial',
            matchedKey: match.key,
            id: match._id,
            dbRecord: match,
            detectedLanguage
          };
          bestScore = score;
        }
      }

      // Increment usage for best match
      if (bestMatch && bestMatch.dbRecord) {
        await bestMatch.dbRecord.incrementUsage();
      }

      return bestMatch;
    } catch (error) {
      console.error('❌ Error finding response:', error);
      return null;
    }
  }

  // Enhanced similarity calculation with multilingual support
  calculateSimilarity(str1, str2) {
    // Normalize both strings
    const normalize = (str) => str.toLowerCase().trim()
      .replace(/[।|॥|?|!|.|,|;|:]/g, '') // Remove punctuation including Devanagari
      .replace(/\s+/g, ' '); // Normalize spaces

    const normalized1 = normalize(str1);
    const normalized2 = normalize(str2);

    // Exact match gets highest score
    if (normalized1 === normalized2) return 1.0;

    // Check if one contains the other
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
      return 0.9;
    }

    // Word-based similarity
    const words1 = normalized1.split(' ').filter(w => w.length > 1);
    const words2 = normalized2.split(' ').filter(w => w.length > 1);
    
    if (words1.length === 0 || words2.length === 0) {
      return 0;
    }

    let matches = 0;
    let totalWords = Math.max(words1.length, words2.length);

    // Check for word matches (including partial)
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1 === word2) {
          matches += 1.0; // Exact word match
          break;
        } else if (word1.includes(word2) || word2.includes(word1)) {
          matches += 0.7; // Partial word match
          break;
        } else if (this.isPhoneticallySimilar(word1, word2)) {
          matches += 0.6; // Phonetic similarity
          break;
        }
      }
    }

    return matches / totalWords;
  }

  // Check phonetic similarity for common variations
  isPhoneticallySimilar(word1, word2) {
    const phoneticMap = {
      // Hindi/Urdu variations
      'kya': ['kia', 'kiya'],
      'hai': ['he', 'hain'],
      'aap': ['ap', 'aapko'],
      'main': ['mai', 'mein'],
      'kaise': ['kese', 'kaese'],
      'kya': ['kia', 'kiya'],
      'haan': ['han', 'ha'],
      'nahi': ['nahin', 'nai'],
      // English variations
      'you': ['u', 'your'],
      'are': ['r', 'ur'],
      'what': ['wat', 'wot'],
      'how': ['hw', 'haw'],
      'hello': ['helo', 'hllo'],
      'help': ['halp', 'hlp']
    };

    for (const [key, variations] of Object.entries(phoneticMap)) {
      if ((word1 === key && variations.includes(word2)) ||
          (word2 === key && variations.includes(word1)) ||
          (variations.includes(word1) && variations.includes(word2))) {
        return true;
      }
    }

    return false;
  }

  // Add new response to database
  async addResponse(category, key, response, userId = null) {
    try {
      const dataset = new Dataset({
        category: category.toLowerCase(),
        key: key.toLowerCase(),
        response: response,
        createdBy: userId,
        metadata: {
          confidence: 1.0,
          priority: 0
        }
      });

      await dataset.save();
      console.log(`✅ Added response: ${category}/${key}`);
      return true;
    } catch (error) {
      if (error.code === 11000) {
        console.error('❌ Duplicate key error:', `${category}/${key} already exists`);
        return false;
      }
      console.error('❌ Error adding response:', error);
      return false;
    }
  }

  // Update existing response
  async updateResponse(category, key, newResponse, userId = null) {
    try {
      const result = await Dataset.findOneAndUpdate(
        { 
          category: category.toLowerCase(), 
          key: key.toLowerCase(),
          isActive: true 
        },
        { 
          response: newResponse,
          updatedAt: new Date()
        },
        { new: true }
      );

      if (result) {
        console.log(`✅ Updated response: ${category}/${key}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error updating response:', error);
      return false;
    }
  }

  // Delete response (soft delete)
  async deleteResponse(category, key) {
    try {
      const result = await Dataset.findOneAndUpdate(
        { 
          category: category.toLowerCase(), 
          key: key.toLowerCase(),
          isActive: true 
        },
        { 
          isActive: false,
          updatedAt: new Date()
        }
      );

      if (result) {
        console.log(`✅ Deleted response: ${category}/${key}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error deleting response:', error);
      return false;
    }
  }

  // Get all responses in a category
  async getCategory(category) {
    try {
      const responses = await Dataset.find({
        category: category.toLowerCase(),
        isActive: true
      }).sort({ key: 1 });

      const result = {};
      responses.forEach(item => {
        result[item.key] = item.response;
      });

      return result;
    } catch (error) {
      console.error('❌ Error getting category:', error);
      return {};
    }
  }

  // Get all categories
  async getCategories() {
    try {
      const categories = await Dataset.distinct('category', { isActive: true });
      return categories.filter(cat => cat !== 'fallback');
    } catch (error) {
      console.error('❌ Error getting categories:', error);
      return [];
    }
  }

  // Get fallback response based on detected language
  async getFallbackResponse(detectedLanguage = 'english') {
    try {
      const fallbackResponses = {
        hindi: "Maaf kijiye, mere paas is sawal ka jawab nahi hai. Kya aap kuch aur puch sakte hain?",
        urdu: "Maaf kijiye, mere paas is sawal ka jawab nahi hai. Kya aap kuch aur pooch sakte hain?",
        punjabi: "Maaf karo, mere kol is sawal da jawab nahi hai. Kuch hor puch sakte ho?",
        bengali: "Khoma korben, amar ei proshner uttor nei. Apni onno kichu jigges korte paren?",
        tamil: "Mannikkavum, enakku indha kelvikku badhil theriyaadhu. Vera edhaavathu kekkalaam?",
        telugu: "Kshaminchandi, naku ee prashnaku jawabhu thelidhu. Vera emaina adagavachu?",
        gujarati: "Maaf karo, mare paase aa prashnano jawab nathi. Kainch hor puchi shakao?",
        marathi: "Maaf kara, majhyakade ya prashnaacha uttar nahi. Dusre kahi vicharu shakta?",
        kannada: "Kshamisi, nanage ii prashnege uttara gottilla. Bere yenu kelabahudha?",
        malayalam: "Kshemikkavu, enikku ee chodyathinu utharam ariyilla. Vere enthenkilum chodyikkam?",
        english: "I don't have an answer for that right now. Could you try asking something else?"
      };

      // Try to get custom fallback from database first
      const customFallback = await Dataset.findOne({
        category: 'fallback',
        key: 'default',
        isActive: true
      });

      if (customFallback) {
        return customFallback.response;
      }

      // Return language-specific fallback
      return fallbackResponses[detectedLanguage] || fallbackResponses.english;
    } catch (error) {
      console.error('❌ Error getting fallback:', error);
      return "I don't have an answer for that right now.";
    }
  }

  // Get dataset statistics
  async getStats() {
    try {
      const stats = await Dataset.getStats();
      return {
        totalResponses: stats.totalResponses || 0,
        totalCategories: stats.totalCategories || 0,
        totalUsage: stats.totalUsage || 0,
        categoryStats: stats.categoryStats?.reduce((acc, item) => {
          acc[item.category] = item.count;
          return acc;
        }, {}) || {}
      };
    } catch (error) {
      console.error('❌ Error getting stats:', error);
      return {
        totalResponses: 0,
        totalCategories: 0,
        totalUsage: 0,
        categoryStats: {}
      };
    }
  }

  // Bulk import responses
  async bulkImport(responses, userId = null) {
    try {
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const [category, categoryResponses] of Object.entries(responses)) {
        if (typeof categoryResponses !== 'object') continue;

        for (const [key, response] of Object.entries(categoryResponses)) {
          try {
            const success = await this.addResponse(category, key, response, userId);
            if (success) {
              successCount++;
            } else {
              errorCount++;
              errors.push(`Failed to add: ${category}/${key}`);
            }
          } catch (error) {
            errorCount++;
            errors.push(`Error adding ${category}/${key}: ${error.message}`);
          }
        }
      }

      return { successCount, errorCount, errors };
    } catch (error) {
      console.error('❌ Error in bulk import:', error);
      return { successCount: 0, errorCount: 1, errors: [error.message] };
    }
  }

  // Search responses
  async searchResponses(searchTerm, limit = 20) {
    try {
      const results = await Dataset.searchByKey(searchTerm).limit(limit);
      return results.map(item => ({
        id: item._id,
        category: item.category,
        key: item.key,
        response: item.response,
        usage: item.usage.count,
        confidence: item.metadata.confidence
      }));
    } catch (error) {
      console.error('❌ Error searching responses:', error);
      return [];
    }
  }
}

module.exports = new DatasetController();