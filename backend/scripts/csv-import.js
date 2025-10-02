const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// Import Dataset model
const Dataset = require('../models/Dataset');

// Function to import from CSV format to MongoDB
// CSV format: category,key,response
// Example: greetings,hello,Hello! How can I help you today?

const importFromCSV = async (csvFilePath) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/accord-ai');
    console.log('✅ Connected to MongoDB');
    
    // Read CSV file
    const csvContent = await fs.readFile(csvFilePath, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    
    // Skip header if present
    const dataLines = lines[0].toLowerCase().includes('category') ? lines.slice(1) : lines;
    
    let importCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const line of dataLines) {
      try {
        // Simple CSV parsing (handles basic cases)
        const parts = line.split(',');
        if (parts.length < 3) continue;
        
        const category = parts[0].trim();
        const key = parts[1].trim().toLowerCase();
        const response = parts.slice(2).join(',').trim();
        
        if (!category || !key || !response) continue;
        
        // Create dataset entry
        const dataset = new Dataset({
          category: category.toLowerCase(),
          key: key,
          response: response,
          metadata: {
            confidence: 1.0,
            priority: 0
          }
        });

        await dataset.save();
        importCount++;
        console.log(`✅ ${category}/${key}`);
        
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⚠️ Duplicate: ${line.split(',')[0]}/${line.split(',')[1]} (skipped)`);
        } else {
          console.error(`❌ Error processing line: ${line}`, error.message);
          errors.push(`${line}: ${error.message}`);
          errorCount++;
        }
      }
    }
    
    console.log(`\n✅ CSV import completed!`);
    console.log(`📊 Imported: ${importCount} responses`);
    console.log(`❌ Errors: ${errorCount} lines`);
    
    // Show final stats
    const stats = await Dataset.getStats();
    console.log(`\n📈 Total in database: ${stats.totalResponses} responses`);
    
    return { success: true, imported: importCount, errors: errorCount, errorDetails: errors };
    
  } catch (error) {
    console.error('❌ Error importing CSV:', error);
    return { success: false, error: error.message };
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
};

// Example usage
const exampleCSV = `category,key,response
greetings,good morning,Good morning! I hope you have a wonderful day ahead.
greetings,good night,Good night! Sweet dreams and rest well.
technical,what is docker,Docker is a platform that uses containerization to make it easier to create deploy and run applications.
business,what is saas,SaaS (Software as a Service) is a software distribution model where applications are hosted by a service provider and made available to customers over the internet.
science,what is dna,DNA (Deoxyribonucleic acid) is a molecule that carries genetic instructions for the development and function of living things.`;

// Create example CSV file
const createExampleCSV = async () => {
  const examplePath = path.join(__dirname, 'example-import.csv');
  await fs.writeFile(examplePath, exampleCSV);
  console.log(`📄 Example CSV created at: ${examplePath}`);
  return examplePath;
};

// Main function
const main = async () => {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node csv-import.js <csv-file-path>');
    console.log('Or: node csv-import.js --example (to create and import example data)');
    return;
  }
  
  if (args[0] === '--example') {
    const examplePath = await createExampleCSV();
    await importFromCSV(examplePath);
  } else {
    await importFromCSV(args[0]);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { importFromCSV, createExampleCSV };