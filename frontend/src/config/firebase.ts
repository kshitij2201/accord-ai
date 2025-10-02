import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyAjcC9GWGWtY0eLtMGV0oAJzw7q33BYEkA",
  authDomain: "accordai-cfcf3.firebaseapp.com",
  projectId: "accordai-cfcf3",
  storageBucket: "accordai-cfcf3.firebasestorage.app",
  messagingSenderId: "723454136762",
  appId: "1:723454136762:web:ebd8033f94443c212b8d83",
  measurementId: "G-G0324T1EM1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Analytics
export const analytics = getAnalytics(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Add scopes for better compatibility
googleProvider.addScope('email');
googleProvider.addScope('profile');

export default app;