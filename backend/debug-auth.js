#!/usr/bin/env node

/**
 * Debug script to check authentication flow
 */

const jwt = require('jsonwebtoken');
const MemoryUser = require('./models/MemoryUser');

const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';

async function debugAuth() {
  console.log('🔍 Debugging Authentication Flow...\n');

  // Step 1: Create a test user
  console.log('1️⃣ Creating test user...');
  const userData = {
    email: 'test@example.com',
    password: 'hashedpassword',
    displayName: 'Test User'
  };

  const user = await MemoryUser.create(userData);
  console.log('✅ User created:', {
    id: user._id,
    email: user.email,
    displayName: user.displayName
  });

  // Step 2: Generate token
  console.log('\n2️⃣ Generating JWT token...');
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
  console.log('✅ Token generated:', token.substring(0, 50) + '...');

  // Step 3: Decode token
  console.log('\n3️⃣ Decoding token...');
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('✅ Token decoded:', decoded);

  // Step 4: Find user by decoded ID
  console.log('\n4️⃣ Finding user by decoded ID...');
  const foundUser = await MemoryUser.findById(decoded.userId);
  console.log('✅ User found:', foundUser ? {
    id: foundUser._id,
    email: foundUser.email,
    displayName: foundUser.displayName
  } : 'NOT FOUND');

  // Step 5: Check all users in memory
  console.log('\n5️⃣ Checking all users in memory...');
  const userStore = require('./models/MemoryUser').userStore;
  console.log('📊 Total users in memory:', userStore.users.size);
  console.log('📋 User IDs in memory:', Array.from(userStore.users.keys()));

  console.log('\n🎉 Debug completed!');
}

debugAuth().catch(console.error);