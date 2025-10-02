const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

const testMessages = [
  // Messages that should be found in dataset
  { message: "hello", expectedSource: "custom-dataset", language: "english" },
  { message: "namaste", expectedSource: "custom-dataset", language: "hindi" },
  { message: "kya haal hai", expectedSource: "custom-dataset", language: "hindi" },
  { message: "assalam alaikum", expectedSource: "custom-dataset", language: "urdu" },
  
  // Messages that should go to Gemini API
  { message: "What is quantum physics?", expectedSource: "gemini", language: "english" },
  { message: "Quantum physics kya hai?", expectedSource: "gemini", language: "hindi" },
  { message: "Tell me about artificial intelligence", expectedSource: "gemini", language: "english" },
  { message: "Mujhe machine learning ke baare mein batao", expectedSource: "gemini", language: "hindi" },
  { message: "Explain blockchain technology", expectedSource: "gemini", language: "english" },
  { message: "Climate change kya hai?", expectedSource: "gemini", language: "hindi" },
];

const testMultilingualFlow = async () => {
  console.log('🧪 Testing Multilingual AI Flow...\n');
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const test of testMessages) {
    totalTests++;
    console.log(`\n📝 Test ${totalTests}: "${test.message}"`);
    console.log(`   Expected: ${test.expectedSource} (${test.language})`);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/ai/chat-anonymous`, {
        message: test.message,
        isAnonymous: true
      });

      if (response.data.success) {
        const actualSource = response.data.source;
        const detectedLanguage = response.data.detectedLanguage;
        const confidence = response.data.confidence;
        
        console.log(`   Actual: ${actualSource} (${detectedLanguage || 'unknown'})`);
        console.log(`   Response: "${response.data.response.substring(0, 100)}..."`);
        
        if (confidence) {
          console.log(`   Confidence: ${Math.round(confidence * 100)}%`);
        }
        
        // Check if source matches expectation (allow some flexibility)
        const sourceMatches = actualSource === test.expectedSource || 
                             (test.expectedSource === 'gemini' && actualSource === 'backup') ||
                             (test.expectedSource === 'custom-dataset' && actualSource === 'custom-dataset-fallback');
        
        if (sourceMatches) {
          console.log(`   ✅ PASS`);
          passedTests++;
        } else {
          console.log(`   ❌ FAIL - Expected ${test.expectedSource}, got ${actualSource}`);
          failedTests++;
        }
      } else {
        console.log(`   ❌ FAIL - API Error: ${response.data.message}`);
        failedTests++;
      }
    } catch (error) {
      console.log(`   ❌ FAIL - Request Error: ${error.message}`);
      failedTests++;
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n📊 Test Results:');
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   ✅ Passed: ${passedTests}`);
  console.log(`   ❌ Failed: ${failedTests}`);
  console.log(`   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Multilingual flow is working perfectly!');
  } else if (passedTests > totalTests * 0.8) {
    console.log('\n✅ Most tests passed! System is working well with minor issues.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the configuration.');
  }
};

// Test dataset responses specifically
const testDatasetResponses = async () => {
  console.log('\n🔍 Testing Dataset Responses...\n');
  
  const datasetTests = [
    "hello",
    "namaste", 
    "kya haal hai",
    "assalam alaikum",
    "what can you do",
    "javascript kya hai",
    "thank you",
    "dhanyawad"
  ];

  for (const message of datasetTests) {
    try {
      const response = await axios.post(`${API_BASE_URL}/dataset/test`, {
        message: message
      });

      console.log(`📝 "${message}"`);
      if (response.data.hasMatch) {
        const match = response.data.match;
        console.log(`   ✅ Match found: ${match.category} (${Math.round(match.confidence * 100)}%)`);
        console.log(`   Response: "${match.response.substring(0, 80)}..."`);
      } else {
        console.log(`   ❌ No match found`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
};

// Main function
const main = async () => {
  try {
    await testDatasetResponses();
    await testMultilingualFlow();
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { testMultilingualFlow, testDatasetResponses };