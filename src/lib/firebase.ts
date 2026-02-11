import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';

/**
 * Firebase Configuration
 * 
 * Following official Firebase v11 modular SDK documentation.
 * Environment variables must be set in .env file.
 */

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let googleProvider: GoogleAuthProvider;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();

    // Optional: Add scopes for Google Drive access
    googleProvider.addScope('https://www.googleapis.com/auth/drive.readonly');
    googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

    console.log('✅ Firebase initialized successfully');
} catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    throw error;
}

export { app, auth, googleProvider };

/**
 * Check if Firebase is properly configured
 */
export function isFirebaseConfigured(): boolean {
    return !!(
        import.meta.env.VITE_FIREBASE_API_KEY &&
        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
        import.meta.env.VITE_FIREBASE_PROJECT_ID
    );
}
