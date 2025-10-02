// Singleton user store to ensure consistent state across modules

class UserStore {
  constructor() {
    if (UserStore.instance) {
      return UserStore.instance;
    }
    
    this.users = new Map();
    this.nextId = 1;
    UserStore.instance = this;
    
    console.log('🏪 UserStore singleton initialized');
  }

  async findOne(query) {
    const users = Array.from(this.users.values());
    
    if (query.email) {
      return users.find(user => user.email === query.email) || null;
    }
    
    if (query._id || query.id) {
      const id = query._id || query.id;
      return this.users.get(id) || null;
    }

    if (query.googleId) {
      return users.find(user => user.googleId === query.googleId) || null;
    }

    if (query.passwordResetToken) {
      return users.find(user => 
        user.passwordResetToken === query.passwordResetToken &&
        user.passwordResetExpiry && 
        new Date() < user.passwordResetExpiry
      ) || null;
    }

    if (query.$or) {
      for (let condition of query.$or) {
        const result = await this.findOne(condition);
        if (result) return result;
      }
    }

    return null;
  }

  async findById(id) {
    const user = this.users.get(id);
    console.log(`🔍 Finding user by ID ${id}:`, user ? 'Found' : 'Not found');
    console.log(`📊 Total users in store: ${this.users.size}`);
    return user || null;
  }

  async save(userData) {
    if (!userData._id) {
      userData._id = this.nextId.toString();
      userData.createdAt = new Date();
      this.nextId++;
    }
    userData.updatedAt = new Date();
    
    this.users.set(userData._id, { ...userData });
    console.log(`💾 User saved with ID ${userData._id}, total users: ${this.users.size}`);
    return { ...userData };
  }

  async create(userData) {
    const user = {
      _id: this.nextId.toString(),
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.nextId++;
    
    this.users.set(user._id, user);
    console.log(`✅ User created with ID ${user._id}, total users: ${this.users.size}`);
    return user;
  }

  // Get all users (for debugging)
  getAllUsers() {
    return Array.from(this.users.values());
  }

  // Get user count
  getUserCount() {
    return this.users.size;
  }
}

// Export singleton instance
module.exports = new UserStore();