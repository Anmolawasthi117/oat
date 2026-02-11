import { create } from 'zustand';
import type { User, AuthMode, FaceEmbedding } from '../types';

/**
 * Authentication State Store
 * 
 * CRITICAL: Following the "No-Blob-In-State" rule.
 * We only store the face EMBEDDING (array of numbers), not the actual image blob.
 */

interface AuthState {
    // User data
    user: User | null;
    authMode: AuthMode;

    // Reference face for matching
    referenceFaceEmbedding: FaceEmbedding | null;

    // Loading states
    isLoading: boolean;
    error: string | null;

    // Actions
    setUser: (user: User | null) => void;
    setAuthMode: (mode: AuthMode) => void;
    setReferenceEmbedding: (embedding: number[]) => void;
    clearReferenceEmbedding: () => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    // Initial state
    user: null,
    authMode: 'guest',
    referenceFaceEmbedding: null,
    isLoading: false,
    error: null,

    // Actions
    setUser: (user) => set({ user }),

    setAuthMode: (mode) => set({ authMode: mode }),

    setReferenceEmbedding: (embedding) =>
        set({
            referenceFaceEmbedding: {
                embedding,
                timestamp: Date.now(),
            },
        }),

    clearReferenceEmbedding: () => set({ referenceFaceEmbedding: null }),

    setLoading: (loading) => set({ isLoading: loading }),

    setError: (error) => set({ error }),

    reset: () => set({
        user: null,
        authMode: 'guest',
        referenceFaceEmbedding: null,
        isLoading: false,
        error: null,
    }),
}));
