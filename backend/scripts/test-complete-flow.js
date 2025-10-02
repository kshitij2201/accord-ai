const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

const testCompleteFlow = async () => {
  console.log('🧪 Testing Complete Multilingual Flow...\n');
  
  // Test messages that should be found in dataset
  const datasetTests = [
    { message: "hello", expectedSource: "custom-dataset", language: "english" },
    { message: "namaste", expectedSource: "custom-dataset", language: "hindi" },
    { message: "kya haal hai", expectedSource: "custom-dataset", language: "hindi" },
    { message: "assalam alaikum", expectedSource: "custom-dataset", language: "urdu" },
    { message: "sat sri akal", expectedSource: "custom-dataset", language: "punjabi" },
    { message: "vanakkam", expectedSource: "custom-dataset", language: "tamil" },
    { message: "what can you do", expectedSource: "custom-dataset", language: "english" },
    { message: "javascript kya hai", expectedSource: "custom-dataset", language: "hindi" },
    { message: "thank you", expectedSource: "custom-dataset", language: "english" },
    { message: "dhanyawad", expectedSource: "custom-dataset", language: "hindi" },
  ];

  // Test messages that should go to AI (but will likely fail due to quota)
  const aiTests = [
    { message: "What is quantum computing in detail?", expectedSource: "gemini", language: "english" },
    { message: "Explain machine learning algorithms", expectedSource: "gemini", language: "english" },
    { message: "Climate change ke effects kya hain?", expectedSource: "gemini", language: "hindi" },
    { message: "Tell me about blockchain technology", expectedSource: "gemini", language: "english" },
  ];

  let totalTests = 0;
  let datasetMatches = 0;
  let aiResponses = 0;
  let fallbackResponses = 0;
  let errors = 0;

  console.log('📚 Testing Dataset Responses...\n');
  
  for (const test of datasetTests) {
    totalTests++;
    console.log(`📝 Test ${totalTests}: "${test.message}"`);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/ai/chat-anonymous`, {
        message: test.message,
        isAnonymous: true
      });

      if (response.data.success) {
        const source = response.data.source;
        const detectedLanguage = response.data.detectedLanguage;
        const confidence = response.data.confidence;
        
        console.log(`   Source: ${source}`);
        console.log(`   Language: ${detectedLanguage || 'unknown'}`);
        if (confidence) console.log(`   Confidence: ${Math.round(confidence * 100)}%`);
        console.log(`   Response: "${response.data.response.substring(0, 80)}..."`);
        
        if (source.includes('dataset')) {
          datasetMatches++;
          console.log(`   ✅ Dataset match found`);
        } else {
          console.log(`   ⚠️ Expected dataset match, got ${source}`);
        }
      } else {
        errors++;
        console.log(`   ❌ API Error: ${response.data.message}`);
      }
    } catch (error) {
      errors++;
      console.log(`   ❌ Request Error: ${error.message}`);
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('🤖 Testing AI Fallback (Expected to use fallback due to quota)...\n');
  
  for (const test of aiTests) {
    totalTests++;
    console.log(`📝 Test ${totalTests}: "${test.message}"`);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/ai/chat-anonymous`, {
        message: test.message,
        isAnonymous: true
      });

      if (response.data.success) {
        const source = response.data.source;
        const detectedLanguage = response.data.detectedLanguage;
        
        console.log(`   Source: ${source}`);
        console.log(`   Language: ${detectedLanguage || 'unknown'}`);
        console.log(`   Response: "${response.data.response.substring(0, 80)}..."`);
        
        if (source === 'gemini') {
          aiResponses++;
          console.log(`   ✅ AI response received`);
        } else if (source.includes('fallback') || source === 'backup') {
          fallbackResponses++;
          console.log(`   ✅ Fallback response (expected due to quota)`);
        } else if (source.includes('dataset')) {
          datasetMatches++;
          console.log(`   ✅ Dataset fallback used`);
        }
      } else {
        errors++;
        console.log(`   ❌ API Error: ${response.data.message}`);
      }
    } catch (error) {
      errors++;
      console.log(`   ❌ Request Error: ${error.message}`);
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('📊 Test Results Summary:');
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   📚 Dataset Matches: ${datasetMatches}`);
  console.log(`   🤖 AI Responses: ${aiResponses}`);
  console.log(`   🔄 Fallback Responses: ${fallbackResponses}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   Success Rate: ${Math.round(((totalTests - errors) / totalTests) * 100)}%`);
  
  console.log('\n🎯 Flow Analysis:');
  if (datasetMatches >= datasetTests.length * 0.8) {
    console.log('   ✅ Dataset matching is working well');
  } else {
    console.log('   ⚠️ Dataset matching needs improvement');
  }
  
  if (aiResponses > 0) {
    console.log('   ✅ Gemini API is working');
  } else {
    console.log('   ⚠️ Gemini API quota exceeded (expected)');
  }
  
  if (fallbackResponses > 0) {
    console.log('   ✅ Fallback system is working');
  }
  
  console.log('\n🌐 Language Detection Test:');
  const languageTests = [
    "Hello how are you",
    "Namaste kaise hain aap",
    "Assalam alaikum kya haal hai",
    "Sat Sri Akal kiddan",
    "Vanakkam eppadi irukkireenga"
  ];
  
  for (const msg of languageTests) {
    try {
      const response = await axios.post(`${API_BASE_URL}/ai/chat-anonymous`, {
        message: msg,
        isAnonymous: true
      });
      
      if (response.data.success) {
        console.log(`   "${msg}" → ${response.data.detectedLanguage || 'unknown'}`);
      }
    } catch (error) {
      console.log(`   "${msg}" → Error: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 300));
  }
};

// Test dataset directly
const testDatasetDirect = async () => {
  console.log('\n🔍 Testing Dataset Direct Access...\n');
  
  const testQueries = [
    "hello",
    "namaste", 
    "javascript kya hai",
    "what can you do",
    "thank you",
    "dhanyawad",
    "assalam alaikum",
    "sat sri akal"
  ];

  for (const query of testQueries) {
    try {
      const response = await axios.post(`${API_BASE_URL}/dataset/test`, {
        message: query
      });

      console.log(`📝 "${query}"`);
      if (response.data.hasMatch) {
        const match = response.data.match;
        console.log(`   ✅ Match: ${match.category} (${Math.round(match.confidence * 100)}%)`);
        console.log(`   Response: "${match.response.substring(0, 60)}..."`);
      } else {
        console.log(`   ❌ No match found`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
};

const main = async () => {
  console.log('🚀 Starting Complete Flow Test...\n');
  console.log('🔗 API Base URL:', API_BASE_URL);
  console.log('🔑 Gemini API Key:', process.env.GEMINI_API_KEY ? 'Configured ✅' : 'Missing ❌');
  console.log('');
  
  try {
    await testDatasetDirect();
    await testCompleteFlow();
    console.log('\n🎉 Complete flow testing finished!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

if (require.main === module) {
  main();
}

module.exports = { testCompleteFlow, testDatasetDirect };