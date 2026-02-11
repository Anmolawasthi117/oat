import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../lib/firebase';
import { useAuthStore } from '../../store/auth';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

/**
 * Authentication Hook
 * Handles both Guest Mode and Firebase Google Auth
 */

export function useAuth() {
  const { user, setUser, setAuthMode } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const signInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      setUser({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      });
      
      setAuthMode('authenticated');
      
      // Navigate to calibration page
      navigate('/calibration');
    } catch (error: any) {
      console.error('❌ Google Sign-In failed:', error);
      alert('Failed to sign in with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const continueAsGuest = () => {
    setAuthMode('guest');
    // Navigate to calibration page
    navigate('/calibration');
  };

  const signOut = () => {
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
  };
}
