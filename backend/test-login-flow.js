#!/usr/bin/env node

/**
 * Test script to debug login flow issues
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api';

async function testLoginFlow() {
  console.log('🔐 Testing Login Flow...\n');

  try {
    // Step 1: Register a new user
    console.log('1️⃣ Registering new user...');
    const registerData = {
      email: `test${Date.now()}@example.com`,
      password: 'testpass123',
      displayName: 'Test User'
    };

    const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, registerData);
    
    if (registerResponse.data.success) {
      console.log('✅ Registration successful');
      console.log('📧 Email:', registerData.email);
      console.log('🎫 Token received:', registerResponse.data.token ? 'Yes' : 'No');
      
      const token = registerResponse.data.token;
      
      // Step 2: Test token verification immediately
      console.log('\n2️⃣ Testing token verification...');
      try {
        const verifyResponse = await axios.get(`${API_BASE_URL}/auth/verify-token`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (verifyResponse.data.success) {
          console.log('✅ Token verification successful');
          console.log('👤 User:', verifyResponse.data.user.email);
        } else {
          console.log('❌ Token verification failed:', verifyResponse.data.message);
        }
      } catch (verifyError) {
        console.log('❌ Token verification error:', verifyError.response?.data?.message || verifyError.message);
      }

      // Step 3: Test login with the same credentials
      console.log('\n3️⃣ Testing login...');
      try {
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: registerData.email,
          password: registerData.password
        });
        
        if (loginResponse.data.success) {
          console.log('✅ Login successful');
          console.log('🎫 New token received:', loginResponse.data.token ? 'Yes' : 'No');
          
          // Step 4: Test the new token
          console.log('\n4️⃣ Testing new token...');
          const newToken = loginResponse.data.token;
          
          const newVerifyResponse = await axios.get(`${API_BASE_URL}/auth/verify-token`, {
            headers: { 'Authorization': `Bearer ${newToken}` }
          });
          
          if (newVerifyResponse.data.success) {
            console.log('✅ New token verification successful');
            console.log('👤 User:', newVerifyResponse.data.user.email);
          } else {
            console.log('❌ New token verification failed:', newVerifyResponse.data.message);
          }
          
        } else {
          console.log('❌ Login failed:', loginResponse.data.message);
        }
      } catch (loginError) {
        console.log('❌ Login error:', loginError.response?.data?.message || loginError.message);
      }

      // Step 5: Test protected route
      console.log('\n5️⃣ Testing protected route...');
      try {
        const protectedResponse = await axios.get(`${API_BASE_URL}/subscription/status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (protectedResponse.data.success) {
          console.log('✅ Protected route access successful');
        } else {
          console.log('❌ Protected route access failed:', protectedResponse.data.message);
        }
      } catch (protectedError) {
        console.log('❌ Protected route error:', protectedError.response?.data?.message || protectedError.message);
      }

    } else {
      console.log('❌ Registration failed:', registerResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('📄 Response:', error.response.data);
    }
  }
}

testLoginFlow();