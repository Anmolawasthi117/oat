import { useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAuthStore } from '../../store/auth';
import { log } from '../../lib/logger';

/**
 * AuthProvider — Syncs Firebase auth state with Zustand store.
 *
 * Firebase persists sessions in IndexedDB automatically.
 * On page load, `onAuthStateChanged` fires with the restored user.
 * We mirror that into our Zustand store so the rest of the app
 * always has the correct auth state.
 *
 * Shows a splash screen while Firebase is restoring the session.
 */

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [isInitializing, setIsInitializing] = useState(true);
    const { setUser, setAuthMode, setLoading } = useAuthStore();

    useEffect(() => {
        setLoading(true);
        log.auth.info('Waiting for Firebase auth state...');

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                log.auth.success('Auth restored', {
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                });

                setUser({
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    displayName: firebaseUser.displayName,
                    photoURL: firebaseUser.photoURL,
                });
                setAuthMode('authenticated');
            } else {
                log.auth.info('No active session — user is guest');
                // Don't reset to guest if user explicitly chose guest mode
                // Only clear if there was a previous authenticated session
                const currentMode = useAuthStore.getState().authMode;
                if (currentMode === 'authenticated') {
                    setUser(null);
                    setAuthMode('guest');
                }
            }

            setLoading(false);
            setIsInitializing(false);
        });

        return () => unsubscribe();
    }, [setUser, setAuthMode, setLoading]);

    // Splash screen while Firebase restores session
    if (isInitializing) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--color-oat-cream)',
                    fontFamily: 'var(--font-body)',
                    gap: '1rem',
                }}
            >
                <div
                    style={{
                        fontSize: '2.5rem',
                        animation: 'breathe 2s ease-in-out infinite',
                    }}
                >
                    🥣
                </div>
                <div
                    style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: '1.5rem',
                        color: 'var(--color-espresso)',
                        letterSpacing: '-0.02em',
                    }}
                >
                    OAT
                </div>
                <div
                    style={{
                        fontSize: '0.8rem',
                        color: 'var(--color-warm-grey)',
                    }}
                >
                    Loading...
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
