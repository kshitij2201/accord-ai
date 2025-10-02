const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const testGeminiAPI = async () => {
  console.log('🧪 Testing Gemini API...\n');
  
  const testMessages = [
    "Hello, how are you?",
    "What is JavaScript?",
    "Namaste, aap kaise hain?",
    "JavaScript kya hai?"
  ];

  for (const message of testMessages) {
    console.log(`📝 Testing: "${message}"`);
    
    try {
      const response = await fetch(`${process.env.GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: message
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          const aiResponse = data.candidates[0].content.parts[0].text;
          console.log(`   ✅ Success: "${aiResponse.substring(0, 100)}..."`);
        } else {
          console.log(`   ❌ No response content in API response`);
          console.log(`   Response:`, JSON.stringify(data, null, 2));
        }
      } else {
        const errorData = await response.text();
        console.log(`   ❌ API Error: ${response.status} ${response.statusText}`);
        console.log(`   Error details: ${errorData}`);
      }
    } catch (error) {
      console.log(`   ❌ Request Error: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};

// Test with language-specific prompts
const testMultilingualPrompts = async () => {
  console.log('🌐 Testing Multilingual Prompts...\n');
  
  const tests = [
    {
      message: "What is artificial intelligence?",
      language: "english",
      instruction: "Please respond in English. Be helpful and friendly."
    },
    {
      message: "Artificial intelligence kya hai?",
      language: "hindi", 
      instruction: "Please respond in Hindi (Devanagari script or Roman Hindi). Be helpful and friendly."
    }
  ];

  for (const test of tests) {
    console.log(`📝 Testing ${test.language}: "${test.message}"`);
    
    const enhancedPrompt = `${test.instruction}\n\nUser question: ${test.message}`;
    
    try {
      const response = await fetch(`${process.env.GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: enhancedPrompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          const aiResponse = data.candidates[0].content.parts[0].text;
          console.log(`   ✅ Success: "${aiResponse.substring(0, 150)}..."`);
        } else {
          console.log(`   ❌ No response content`);
        }
      } else {
        const errorData = await response.text();
        console.log(`   ❌ API Error: ${response.status}`);
        console.log(`   Details: ${errorData.substring(0, 200)}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};

const main = async () => {
  console.log('🔑 Gemini API Key:', process.env.GEMINI_API_KEY ? 'Configured ✅' : 'Missing ❌');
  console.log('🌐 Gemini API URL:', process.env.GEMINI_API_URL);
  console.log('');
  
  await testGeminiAPI();
  await testMultilingualPrompts();
  
  console.log('🎉 Gemini API testing completed!');
};

if (require.main === module) {
  main();
}

module.exports = { testGeminiAPI, testMultilingualPrompts };