const fs = require('fs').promises;
const path = require('path');

// Example script to import data into your custom dataset
// You can modify this to import from CSV, JSON, or other formats

const importData = async () => {
  const datasetPath = path.join(__dirname, '../data/custom-dataset.json');
  
  try {
    // Read existing dataset
    const existingData = await fs.readFile(datasetPath, 'utf8');
    const dataset = JSON.parse(existingData);
    
    // Example: Add more responses programmatically
    const newResponses = {
      programming: {
        "what is html": "HTML (HyperText Markup Language) is the standard markup language for creating web pages. It describes the structure of a web page using elements and tags.",
        "what is css": "CSS (Cascading Style Sheets) is a stylesheet language used to describe the presentation of a document written in HTML. It controls layout, colors, fonts, and more.",
        "what is api": "An API (Application Programming Interface) is a set of protocols and tools for building software applications. It specifies how software components should interact.",
        "what is database": "A database is an organized collection of structured information, or data, typically stored electronically in a computer system and managed by a database management system (DBMS)."
      },
      business: {
        "what is marketing": "Marketing is the process of promoting, selling, and distributing a product or service. It includes market research, advertising, sales, and customer service.",
        "what is startup": "A startup is a young company founded to develop a unique product or service, bring it to market, and make it irresistible and irreplaceable for customers.",
        "what is roi": "ROI (Return on Investment) is a performance measure used to evaluate the efficiency of an investment or compare the efficiency of several different investments."
      },
      science: {
        "what is ai": "Artificial Intelligence (AI) is the simulation of human intelligence in machines that are programmed to think and learn like humans.",
        "what is machine learning": "Machine Learning is a subset of AI that enables computers to learn and improve from experience without being explicitly programmed for every task.",
        "what is quantum computing": "Quantum computing is a type of computation that harnesses quantum mechanical phenomena like superposition and entanglement to process information."
      }
    };
    
    // Merge new responses with existing dataset
    for (const [category, responses] of Object.entries(newResponses)) {
      if (!dataset[category]) {
        dataset[category] = {};
      }
      
      Object.assign(dataset[category], responses);
    }
    
    // Save updated dataset
    await fs.writeFile(datasetPath, JSON.stringify(dataset, null, 2));
    
    console.log('✅ Dataset updated successfully!');
    console.log(`📊 Total categories: ${Object.keys(dataset).length - 1}`); // -1 for fallback
    
    let totalResponses = 0;
    for (const [category, responses] of Object.entries(dataset)) {
      if (category !== 'fallback') {
        const count = Object.keys(responses).length;
        console.log(`   ${category}: ${count} responses`);
        totalResponses += count;
      }
    }
    
    console.log(`📝 Total responses: ${totalResponses}`);
    
  } catch (error) {
    console.error('❌ Error importing data:', error);
  }
};

// Run the import
importData();

// Export for use in other scripts
module.exports = { importData };