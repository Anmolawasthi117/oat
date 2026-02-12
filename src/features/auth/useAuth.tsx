import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../../lib/firebase';
import { useAuthStore } from '../../store/auth';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { log } from '../../lib/logger';

/**
 * Authentication Hook
 * Handles Guest Mode and Firebase Google Auth
 */

export function useAuth() {
  const { user, setUser, setAuthMode } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();

  const signInWithGoogle = async () => {
    log.auth.info('Starting Google Sign-In...');

    // Check if Firebase is configured
    if (!isFirebaseConfigured()) {
      const msg = 'Firebase is not configured. Check your .env file.';
      log.auth.error(msg);
      setAuthError(msg);
      return;
    }

    setIsLoading(true);
    setAuthError(null);

    try {
      const result = await signInWithPopup(auth, googleProvider);

      log.auth.success('Google Sign-In successful', {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
      });

      setUser({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      });

      setAuthMode('authenticated');
      navigate('/calibration');
    } catch (error: any) {
      log.auth.error('Google Sign-In failed', {
        code: error.code,
        message: error.message,
      });

      // Friendly error messages
      let friendlyMsg = 'Sign-in failed. Please try again.';
      if (error.code === 'auth/configuration-not-found') {
        friendlyMsg = 'Google Sign-In is not enabled in Firebase. Please enable it in Firebase Console → Authentication → Sign-in method.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        friendlyMsg = 'Sign-in cancelled.';
      } else if (error.code === 'auth/network-request-failed') {
        friendlyMsg = 'Network error. Check your internet connection.';
      }

      setAuthError(friendlyMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const continueAsGuest = () => {
    log.auth.info('Continuing as guest');
    setAuthMode('guest');
    setAuthError(null);
    navigate('/calibration');
  };

  const signOut = () => {
    log.auth.info('Signing out');
    setUser(null);
    setAuthMode('guest');
    navigate('/');
  };

  return {
    user,
    signInWithGoogle,
    continueAsGuest,
    signOut,
    isLoading,
    authError,
  };
}
