import { create } from 'zustand';
import type { ProcessingStatus } from '../types';

/**
 * File Processing State Store
 * 
 * Tracks the state of photo ingestion and AI processing.
 * NEVER stores Blob/File objects - only metadata and IDs.
 */

interface ProcessingState {
    // Processing status
    status: ProcessingStatus;

    // Progress tracking
    totalFiles: number;
    processedFiles: number;
    matchedFiles: number;

    // File IDs (NOT the files themselves!)
    currentFileId: string | null;

    // Error handling
    error: string | null;
    failedFiles: string[];

    // Actions
    setStatus: (status: ProcessingStatus) => void;
    setTotalFiles: (count: number) => void;
    incrementProcessed: () => void;
    incrementMatched: () => void;
    setCurrentFile: (fileId: string | null) => void;
    setError: (error: string | null) => void;
    addFailedFile: (fileId: string) => void;
    reset: () => void;
}

export const useProcessingStore = create<ProcessingState>((set) => ({
    // Initial state
    status: 'idle',
    totalFiles: 0,
    processedFiles: 0,
    matchedFiles: 0,
    currentFileId: null,
    error: null,
    failedFiles: [],

    // Actions
    setStatus: (status) => set({ status }),

    setTotalFiles: (count) => set({ totalFiles: count }),

    incrementProcessed: () =>
        set((state) => ({ processedFiles: state.processedFiles + 1 })),

    incrementMatched: () =>
        set((state) => ({ matchedFiles: state.matchedFiles + 1 })),

    setCurrentFile: (fileId) => set({ currentFileId: fileId }),

    setError: (error) => set({ error, status: 'error' }),

    addFailedFile: (fileId) =>
        set((state) => ({
            failedFiles: [...state.failedFiles, fileId],
        })),

    reset: () => set({
        status: 'idle',
        totalFiles: 0,
        processedFiles: 0,
        matchedFiles: 0,
        currentFileId: null,
        error: null,
        failedFiles: [],
    }),
}));

// Computed values (selectors)
export const selectProgress = (state: ProcessingState): number => {
    if (state.totalFiles === 0) return 0;
    return Math.round((state.processedFiles / state.totalFiles) * 100);
};

export const selectIsProcessing = (state: ProcessingState): boolean => {
    return state.status === 'processing' || state.status === 'calibrating';
};
