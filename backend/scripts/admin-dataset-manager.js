const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Dataset = require('../models/Dataset');

class AdminDatasetManager {
  constructor() {
    console.log('🔧 Admin Dataset Manager - For Admin Use Only');
  }

  async connect() {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/accord-ai');
      console.log('✅ Connected to MongoDB');
      return true;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      return false;
    }
  }

  async disconnect() {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }

  // Add single response
  async addResponse(category, key, response, tags = []) {
    try {
      const dataset = new Dataset({
        category: category.toLowerCase(),
        key: key.toLowerCase(),
        response: response,
        metadata: {
          confidence: 1.0,
          priority: 0,
          tags: ['admin-added', ...tags]
        }
      });

      await dataset.save();
      console.log(`✅ Added: ${category}/${key}`);
      return true;
    } catch (error) {
      if (error.code === 11000) {
        console.log(`⚠️ Already exists: ${category}/${key}`);
        return false;
      }
      console.error(`❌ Error adding ${category}/${key}:`, error.message);
      return false;
    }
  }

  // Bulk add responses
  async bulkAdd(responses) {
    let successCount = 0;
    let errorCount = 0;

    for (const [category, categoryResponses] of Object.entries(responses)) {
      console.log(`\n📂 Processing category: ${category}`);
      
      for (const [key, response] of Object.entries(categoryResponses)) {
        const success = await this.addResponse(category, key, response);
        if (success) {
          successCount++;
        } else {
          errorCount++;
        }
      }
    }

    console.log(`\n📊 Bulk add completed:`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
    return { successCount, errorCount };
  }

  // Update response
  async updateResponse(category, key, newResponse) {
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
        console.log(`✅ Updated: ${category}/${key}`);
        return true;
      } else {
        console.log(`❌ Not found: ${category}/${key}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error updating ${category}/${key}:`, error.message);
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
        console.log(`✅ Deleted: ${category}/${key}`);
        return true;
      } else {
        console.log(`❌ Not found: ${category}/${key}`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Error deleting ${category}/${key}:`, error.message);
      return false;
    }
  }

  // Search responses
  async searchResponses(searchTerm) {
    try {
      const results = await Dataset.find({
        $and: [
          { isActive: true },
          {
            $or: [
              { key: { $regex: searchTerm, $options: 'i' } },
              { response: { $regex: searchTerm, $options: 'i' } },
              { category: { $regex: searchTerm, $options: 'i' } }
            ]
          }
        ]
      }).limit(20);

      console.log(`\n🔍 Search results for "${searchTerm}":`);
      results.forEach(item => {
        console.log(`   ${item.category}/${item.key}: "${item.response.substring(0, 60)}..."`);
      });

      return results;
    } catch (error) {
      console.error('❌ Search error:', error.message);
      return [];
    }
  }

  // Get statistics
  async getStats() {
    try {
      const stats = await Dataset.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            totalUsage: { $sum: '$usage.count' }
          }
        },
        {
          $group: {
            _id: null,
            totalResponses: { $sum: '$count' },
            totalCategories: { $sum: 1 },
            totalUsage: { $sum: '$totalUsage' },
            categoryStats: {
              $push: {
                category: '$_id',
                count: '$count',
                usage: '$totalUsage'
              }
            }
          }
        }
      ]);

      const result = stats[0] || {
        totalResponses: 0,
        totalCategories: 0,
        totalUsage: 0,
        categoryStats: []
      };

      console.log('\n📊 Dataset Statistics:');
      console.log(`Total Responses: ${result.totalResponses}`);
      console.log(`Total Categories: ${result.totalCategories}`);
      console.log(`Total Usage: ${result.totalUsage}`);
      
      console.log('\nCategory Breakdown:');
      result.categoryStats.forEach(cat => {
        console.log(`  ${cat.category}: ${cat.count} responses (${cat.usage} uses)`);
      });

      return result;
    } catch (error) {
      console.error('❌ Stats error:', error.message);
      return null;
    }
  }

  // Import from CSV file
  async importFromCSV(csvFilePath) {
    try {
      const fs = require('fs').promises;
      const csvContent = await fs.readFile(csvFilePath, 'utf8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      // Skip header if present
      const dataLines = lines[0].toLowerCase().includes('category') ? lines.slice(1) : lines;
      
      let successCount = 0;
      let errorCount = 0;
      
      for (const line of dataLines) {
        try {
          const parts = line.split(',');
          if (parts.length < 3) continue;
          
          const category = parts[0].trim();
          const key = parts[1].trim();
          const response = parts.slice(2).join(',').trim();
          
          if (!category || !key || !response) continue;
          
          const success = await this.addResponse(category, key, response, ['csv-import']);
          if (success) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
          console.error(`Error processing line: ${line}`, error.message);
        }
      }
      
      console.log(`\n📄 CSV Import completed:`);
      console.log(`✅ Success: ${successCount}`);
      console.log(`❌ Errors: ${errorCount}`);
      
      return { successCount, errorCount };
    } catch (error) {
      console.error('❌ CSV import error:', error.message);
      return { successCount: 0, errorCount: 1 };
    }
  }
}

// Interactive CLI
const runInteractiveCLI = async () => {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => {
    return new Promise((resolve) => {
      rl.question(prompt, resolve);
    });
  };

  const manager = new AdminDatasetManager();
  
  if (!(await manager.connect())) {
    rl.close();
    return;
  }

  console.log('\n🔧 Admin Dataset Manager - Interactive Mode');
  console.log('Commands: add, update, delete, search, stats, import, bulk, quit');

  while (true) {
    const command = await question('\n> ');
    
    switch (command.toLowerCase()) {
      case 'add':
        const category = await question('Category: ');
        const key = await question('Key: ');
        const response = await question('Response: ');
        await manager.addResponse(category, key, response);
        break;
        
      case 'update':
        const updateCategory = await question('Category: ');
        const updateKey = await question('Key: ');
        const newResponse = await question('New Response: ');
        await manager.updateResponse(updateCategory, updateKey, newResponse);
        break;
        
      case 'delete':
        const deleteCategory = await question('Category: ');
        const deleteKey = await question('Key: ');
        await manager.deleteResponse(deleteCategory, deleteKey);
        break;
        
      case 'search':
        const searchTerm = await question('Search term: ');
        await manager.searchResponses(searchTerm);
        break;
        
      case 'stats':
        await manager.getStats();
        break;
        
      case 'import':
        const csvPath = await question('CSV file path: ');
        await manager.importFromCSV(csvPath);
        break;
        
      case 'bulk':
        console.log('Bulk add example - modify the script to add your data');
        const sampleData = {
          'custom': {
            'test key': 'Test response'
          }
        };
        await manager.bulkAdd(sampleData);
        break;
        
      case 'quit':
      case 'exit':
        await manager.disconnect();
        rl.close();
        return;
        
      default:
        console.log('Unknown command. Available: add, update, delete, search, stats, import, bulk, quit');
    }
  }
};

// Run if called directly
if (require.main === module) {
  runInteractiveCLI();
}

module.exports = AdminDatasetManager;