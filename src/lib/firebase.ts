import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { log } from './logger';

/**
 * Firebase Configuration
 * Uses VITE_ env variables set in .env
 */

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let googleProvider: GoogleAuthProvider;

try {
    log.auth.info('Initializing Firebase...', {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
        hasApiKey: !!firebaseConfig.apiKey,
    });

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();

    // Add scopes for Google Drive access
    googleProvider.addScope('https://www.googleapis.com/auth/drive.readonly');
    googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

    log.auth.success('Firebase initialized', { projectId: firebaseConfig.projectId });
} catch (error) {
    log.auth.error('Firebase initialization failed', error);
    throw error;
}

export { app, auth, googleProvider };

/**
 * Check if Firebase is properly configured
 */
export function isFirebaseConfigured(): boolean {
    const configured = !!(
        import.meta.env.VITE_FIREBASE_API_KEY &&
        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
        import.meta.env.VITE_FIREBASE_PROJECT_ID
    );

    if (!configured) {
        log.auth.warn('Firebase not fully configured — check .env variables');
    }

    return configured;
}
