const admin = require('firebase-admin');
require('dotenv').config();

// For development, we'll use a mock Firebase setup
// In production, you would need to download the real service account key from Firebase Console

let auth, db, realtimeDb;

try {
  // Try to initialize Firebase Admin SDK
  if (process.env.NODE_ENV === 'production' && process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    // Production setup with real service account
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });
    
    auth = admin.auth();
    db = admin.firestore();
    realtimeDb = admin.database();
  } else {
    // Development setup with mock functions
    console.log('🔧 Running in development mode with mock Firebase');
    
    auth = {
      verifyIdToken: async (token) => {
        // Mock verification for development
        return {
          uid: 'mock-user-id',
          email: 'user@example.com',
          name: 'Mock User'
        };
      },
      createUser: async (properties) => {
        return {
          uid: 'mock-user-' + Date.now(),
          email: properties.email,
          displayName: properties.displayName
        };
      }
    };
    
    db = {
      collection: (name) => ({
        doc: (id) => ({
          get: async () => ({ exists: false, data: () => null }),
          set: async () => console.log(`Mock: Setting document ${id} in ${name}`),
          update: async () => console.log(`Mock: Updating document ${id} in ${name}`)
        }),
        add: async (data) => {
          console.log(`Mock: Adding document to ${name}`, data);
          return { id: 'mock-doc-' + Date.now() };
        }
      })
    };
    
    realtimeDb = {
      ref: (path) => ({
        set: async () => console.log(`Mock: Setting realtime data at ${path}`),
        get: async () => ({ exists: () => false, val: () => null })
      })
    };
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  console.log('🔧 Using mock Firebase for development');
  
  // Fallback to mock setup
  auth = {
    verifyIdToken: async (token) => {
      return {
        uid: 'mock-user-id',
        email: 'user@example.com',
        name: 'Mock User'
      };
    }
  };
  
  db = {
    collection: () => ({
      doc: () => ({
        get: async () => ({ exists: false, data: () => null }),
        set: async () => {},
        update: async () => {}
      })
    })
  };
  
  realtimeDb = {
    ref: () => ({
      set: async () => {},
      get: async () => ({ exists: () => false, val: () => null })
    })
  };
}

module.exports = {
  admin: admin || null,
  auth,
  db,
  realtimeDb
};
