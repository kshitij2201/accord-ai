// Simple in-memory user storage for development
// In production, this should use a real database

const userStore = require('./UserStore');

// Mock User model that mimics Mongoose behavior
class MockUser {
  constructor(data) {
    Object.assign(this, data);
  }

  async save() {
    return userStore.save(this);
  }

  static async findOne(query) {
    return userStore.findOne(query);
  }

  static async findById(id) {
    return userStore.findById(id);
  }

  static async create(data) {
    const user = await userStore.create(data);
    return user;
  }

  select(fields) {
    // Simple implementation - in real Mongoose, this would exclude password
    if (fields === '-password') {
      const { password, ...userWithoutPassword } = this;
      return userWithoutPassword;
    }
    return this;
  }
}

// Export MockUser and userStore
module.exports = MockUser;
module.exports.userStore = userStore;
