#!/usr/bin/env node

/**
 * Test frontend login from browser perspective
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testFrontendLogin() {
  console.log('🌐 Testing Frontend Login Flow...\n');

  try {
    // Step 1: Test registration endpoint
    console.log('1️⃣ Testing registration endpoint...');
    const registerData = {
      email: `frontend${Date.now()}@example.com`,
      password: 'testpass123',
      displayName: 'Frontend Test User'
    };

    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, registerData, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173'
      }
    });
    
    if (registerResponse.data.success) {
      console.log('✅ Registration successful');
      console.log('📧 Email:', registerData.email);
      console.log('🎫 Token:', registerResponse.data.token ? 'Received' : 'Missing');
      
      const token = registerResponse.data.token;
      
      // Step 2: Test login endpoint
      console.log('\n2️⃣ Testing login endpoint...');
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: registerData.email,
        password: registerData.password
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:5173'
        }
      });
      
      if (loginResponse.data.success) {
        console.log('✅ Login successful');
        console.log('🎫 New token:', loginResponse.data.token ? 'Received' : 'Missing');
        console.log('👤 User data:', loginResponse.data.user ? 'Received' : 'Missing');
        
        const loginToken = loginResponse.data.token;
        
        // Step 3: Test token verification
        console.log('\n3️⃣ Testing token verification...');
        const verifyResponse = await axios.get(`${API_BASE_URL}/auth/verify-token`, {
          headers: {
            'Authorization': `Bearer ${loginToken}`,
            'Origin': 'http://localhost:5173'
          }
        });
        
        if (verifyResponse.data.success) {
          console.log('✅ Token verification successful');
          console.log('👤 Verified user:', verifyResponse.data.user.email);
        } else {
          console.log('❌ Token verification failed:', verifyResponse.data.message);
        }
        
        // Step 4: Test chat endpoint with authentication
        console.log('\n4️⃣ Testing authenticated chat...');
        const chatResponse = await axios.post(`${API_BASE_URL}/ai/chat`, {
          message: 'Hello, this is a test message',
          language: 'en'
        }, {
          headers: {
            'Authorization': `Bearer ${loginToken}`,
            'Content-Type': 'application/json',
            'Origin': 'http://localhost:5173'
          }
        });
        
        if (chatResponse.data.success) {
          console.log('✅ Authenticated chat successful');
          console.log('💬 Response:', chatResponse.data.response.substring(0, 50) + '...');
        } else {
          console.log('❌ Authenticated chat failed:', chatResponse.data.message);
        }
        
      } else {
        console.log('❌ Login failed:', loginResponse.data.message);
      }
      
    } else {
      console.log('❌ Registration failed:', registerResponse.data.message);
    }

    console.log('\n🎉 Frontend login test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('📄 Response status:', error.response.status);
      console.error('📄 Response data:', error.response.data);
    }
  }
}

testFrontendLogin();