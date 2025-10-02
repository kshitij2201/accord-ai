#!/usr/bin/env node

/**
 * Test the memory store directly
 */

const MemoryUser = require('./models/MemoryUser');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-super-secret-jwt-key-change-in-production';

async function testMemoryStore() {
  console.log('🧪 Testing Memory Store Directly...\n');

  // Step 1: Create user using create method
  console.log('1️⃣ Creating user with User.create()...');
  const userData = {
    email: 'test@example.com',
    password: 'hashedpass',
    displayName: 'Test User'
  };

  const user1 = await MemoryUser.create(userData);
  console.log('✅ User created:', { id: user1._id, email: user1.email });

  // Step 2: Try to find the user immediately
  console.log('\n2️⃣ Finding user immediately after creation...');
  const foundUser1 = await MemoryUser.findById(user1._id);
  console.log('✅ User found:', foundUser1 ? { id: foundUser1._id, email: foundUser1.email } : 'NOT FOUND');

  // Step 3: Generate token and decode it
  console.log('\n3️⃣ Generating and testing token...');
  const token = jwt.sign({ userId: user1._id }, JWT_SECRET, { expiresIn: '7d' });
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('✅ Token decoded userId:', decoded.userId);

  // Step 4: Find user by decoded ID
  console.log('\n4️⃣ Finding user by decoded token ID...');
  const foundUser2 = await MemoryUser.findById(decoded.userId);
  console.log('✅ User found by token:', foundUser2 ? { id: foundUser2._id, email: foundUser2.email } : 'NOT FOUND');

  // Step 5: Check memory store state
  console.log('\n5️⃣ Checking memory store state...');
  const userStore = require('./models/MemoryUser').userStore;
  console.log('📊 Users in store:', userStore.users.size);
  console.log('📋 User IDs:', Array.from(userStore.users.keys()));
  console.log('📋 User data:', Array.from(userStore.users.values()).map(u => ({ id: u._id, email: u.email })));

  // Step 6: Test with new User().save()
  console.log('\n6️⃣ Testing with new User().save()...');
  const userData2 = {
    email: 'test2@example.com',
    password: 'hashedpass2',
    displayName: 'Test User 2'
  };

  const user2 = await new MemoryUser(userData2).save();
  console.log('✅ User saved:', { id: user2._id, email: user2.email });

  const foundUser3 = await MemoryUser.findById(user2._id);
  console.log('✅ User found after save:', foundUser3 ? { id: foundUser3._id, email: foundUser3.email } : 'NOT FOUND');

  console.log('\n🎉 Memory store test completed!');
}

testMemoryStore().catch(console.error);