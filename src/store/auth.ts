import { create } from 'zustand';
import type { User, AuthMode, FaceEmbedding } from '../types';

/**
 * Authentication State Store
 * 
 * CRITICAL: Following the "No-Blob-In-State" rule.
 * We only store the face EMBEDDING (array of numbers), not the actual image blob.
 */

interface AuthState {
    user: User | null;
    authMode: AuthMode;
    referenceFaceEmbedding: FaceEmbedding | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    setUser: (user: User | null) => void;
    setAuthMode: (mode: AuthMode) => void;
    setReferenceEmbedding: (embedding: number[]) => void;
    setReferenceFaceEmbedding: (data: { embedding: number[]; capturedAt: number }) => void;
    clearReferenceEmbedding: () => void;
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    authMode: 'guest',
    referenceFaceEmbedding: null,
    isLoading: false,
    error: null,

    setUser: (user) => set({ user }),

    setAuthMode: (mode) => set({ authMode: mode }),

    setReferenceEmbedding: (embedding) =>
        set({
            referenceFaceEmbedding: {
                embedding,
                timestamp: Date.now(),
            },
        }),

    // Called by CalibrationPage with { embedding, capturedAt }
    setReferenceFaceEmbedding: (data) =>
        set({
            referenceFaceEmbedding: {
                embedding: data.embedding,
                timestamp: data.capturedAt,
            },
        }),

    clearReferenceEmbedding: () => set({ referenceFaceEmbedding: null }),

    setLoading: (loading) => set({ isLoading: loading }),

    setError: (error) => set({ error }),

    reset: () =>
        set({
            user: null,
            authMode: 'guest',
            referenceFaceEmbedding: null,
            isLoading: false,
            error: null,
        }),
}));
