const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_BASE_URL = 'http://localhost:3001/api';

const testAuthentication = async () => {
  console.log('🔐 Testing Authentication System...\n');
  
  // Test 1: Anonymous Chat (Should work without auth)
  console.log('1. Testing Anonymous Chat...');
  try {
    const response = await axios.post(`${API_BASE_URL}/ai/chat-anonymous`, {
      message: 'hello',
      isAnonymous: true
    });
    
    if (response.data.success) {
      console.log('   ✅ Anonymous chat working');
      console.log(`   Response: "${response.data.response.substring(0, 50)}..."`);
    } else {
      console.log('   ❌ Anonymous chat failed:', response.data.message);
    }
  } catch (error) {
    console.log('   ❌ Anonymous chat error:', error.message);
  }
  
  // Test 2: Protected Route without Token (Should fail)
  console.log('\n2. Testing Protected Route without Token...');
  try {
    const response = await axios.post(`${API_BASE_URL}/ai/chat`, {
      message: 'hello'
    });
    
    console.log('   ❌ Protected route allowed access without token (security issue)');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('   ✅ Protected route properly blocked without token');
    } else {
      console.log('   ⚠️ Unexpected error:', error.message);
    }
  }
  
  // Test 3: User Registration
  console.log('\n3. Testing User Registration...');
  const testUser = {
    email: `test${Date.now()}@example.com`,
    password: 'testpassword123',
    displayName: 'Test User'
  };
  
  let authToken = null;
  
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, testUser);
    
    if (response.data.success) {
      console.log('   ✅ User registration successful');
      authToken = response.data.token;
      console.log('   Token received:', authToken ? 'Yes' : 'No');
    } else {
      console.log('   ❌ Registration failed:', response.data.message);
    }
  } catch (error) {
    console.log('   ❌ Registration error:', error.response?.data?.message || error.message);
  }
  
  // Test 4: User Login
  console.log('\n4. Testing User Login...');
  if (!authToken) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      
      if (response.data.success) {
        console.log('   ✅ User login successful');
        authToken = response.data.token;
      } else {
        console.log('   ❌ Login failed:', response.data.message);
      }
    } catch (error) {
      console.log('   ❌ Login error:', error.response?.data?.message || error.message);
    }
  } else {
    console.log('   ⏭️ Skipping login (already have token from registration)');
  }
  
  // Test 5: Token Verification
  console.log('\n5. Testing Token Verification...');
  if (authToken) {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/verify-token`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.data.success) {
        console.log('   ✅ Token verification successful');
        console.log(`   User: ${response.data.user.displayName} (${response.data.user.email})`);
      } else {
        console.log('   ❌ Token verification failed:', response.data.message);
      }
    } catch (error) {
      console.log('   ❌ Token verification error:', error.response?.data?.message || error.message);
    }
  } else {
    console.log('   ⏭️ Skipping token verification (no token available)');
  }
  
  // Test 6: Authenticated Chat
  console.log('\n6. Testing Authenticated Chat...');
  if (authToken) {
    try {
      const response = await axios.post(`${API_BASE_URL}/ai/chat`, {
        message: 'hello'
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.data.success) {
        console.log('   ✅ Authenticated chat working');
        console.log(`   Response: "${response.data.response.substring(0, 50)}..."`);
      } else {
        console.log('   ❌ Authenticated chat failed:', response.data.message);
      }
    } catch (error) {
      console.log('   ❌ Authenticated chat error:', error.response?.data?.message || error.message);
    }
  } else {
    console.log('   ⏭️ Skipping authenticated chat (no token available)');
  }
  
  // Test 7: Dataset Management (Protected)
  console.log('\n7. Testing Dataset Management...');
  if (authToken) {
    try {
      const response = await axios.post(`${API_BASE_URL}/dataset/add`, {
        category: 'test',
        key: 'test message',
        response: 'This is a test response'
      }, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      if (response.data.success) {
        console.log('   ✅ Dataset management working (authenticated)');
      } else {
        console.log('   ❌ Dataset management failed:', response.data.message);
      }
    } catch (error) {
      console.log('   ❌ Dataset management error:', error.response?.data?.message || error.message);
    }
  } else {
    console.log('   ⏭️ Skipping dataset management (no token available)');
  }
  
  // Test 8: Google Sign-In Endpoint
  console.log('\n8. Testing Google Sign-In Endpoint...');
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/google`, {
      email: 'test.google@example.com',
      displayName: 'Test Google User',
      photoURL: 'https://example.com/photo.jpg',
      googleId: 'google123456'
    });
    
    if (response.data.success) {
      console.log('   ✅ Google sign-in endpoint working');
    } else {
      console.log('   ❌ Google sign-in failed:', response.data.message);
    }
  } catch (error) {
    console.log('   ❌ Google sign-in error:', error.response?.data?.message || error.message);
  }
  
  // Test 9: Trial Status Check
  console.log('\n9. Testing Trial Status...');
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/trial-status`);
    
    if (response.data.success || response.data.isTrialActive !== undefined) {
      console.log('   ✅ Trial status endpoint working');
      console.log(`   Trial Active: ${response.data.isTrialActive}`);
    } else {
      console.log('   ❌ Trial status failed:', response.data.message);
    }
  } catch (error) {
    console.log('   ❌ Trial status error:', error.response?.data?.message || error.message);
  }
  
  console.log('\n📊 Authentication Test Summary:');
  console.log('   - Anonymous access: Should work for chat-anonymous');
  console.log('   - Protected routes: Should require authentication');
  console.log('   - Registration/Login: Should provide JWT tokens');
  console.log('   - Token verification: Should validate user identity');
  console.log('   - Google OAuth: Should handle Google sign-in');
  console.log('   - Trial system: Should track anonymous usage');
  
  console.log('\n🔒 Security Recommendations:');
  console.log('   1. Always use HTTPS in production');
  console.log('   2. Set strong JWT secrets');
  console.log('   3. Implement rate limiting');
  console.log('   4. Validate all inputs');
  console.log('   5. Use secure session management');
};

// Test Firebase Configuration
const testFirebaseConfig = () => {
  console.log('\n🔥 Firebase Configuration Check:');
  
  const firebaseKeys = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID'
  ];
  
  firebaseKeys.forEach(key => {
    const value = process.env[key];
    console.log(`   ${key}: ${value ? '✅ Configured' : '❌ Missing'}`);
  });
  
  console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   JWT_EXPIRES_IN: ${process.env.JWT_EXPIRES_IN || '7d'}`);
};

const main = async () => {
  console.log('🚀 Starting Authentication System Test...\n');
  
  testFirebaseConfig();
  await testAuthentication();
  
  console.log('\n🎉 Authentication testing completed!');
};

if (require.main === module) {
  main();
}

module.exports = { testAuthentication };