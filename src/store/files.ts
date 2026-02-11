import { create } from 'zustand';

/**
 * Files Metadata Store
 * 
 * Stores ONLY file IDs and opfsPaths, never the actual Blob/File objects.
 * The actual files live in OPFS and IndexedDB.
 */

interface FileState {
    // Current file IDs being displayed (for virtualization)
    visibleFileIds: string[];

    // Selected files (for export)
    selectedFileIds: Set<string>;

    // View mode
    viewMode: 'grid' | 'list';

    // Filters
    showOnlyMatches: boolean;
    sortBy: 'timestamp' | 'filename' | 'confidence';
    sortOrder: 'asc' | 'desc';

    // Actions
    setVisibleFiles: (fileIds: string[]) => void;
    toggleSelection: (fileId: string) => void;
    selectAll: () => void;
    clearSelection: () => void;
    setViewMode: (mode: 'grid' | 'list') => void;
    setShowOnlyMatches: (show: boolean) => void;
    setSorting: (sortBy: FileState['sortBy'], order: FileState['sortOrder']) => void;
    reset: () => void;
}

export const useFileStore = create<FileState>((set) => ({
    // Initial state
    visibleFileIds: [],
    selectedFileIds: new Set(),
    viewMode: 'grid',
    showOnlyMatches: false,
    sortBy: 'timestamp',
    sortOrder: 'desc',

    // Actions
    setVisibleFiles: (fileIds) => set({ visibleFileIds: fileIds }),

    toggleSelection: (fileId) =>
        set((state) => {
            const newSelection = new Set(state.selectedFileIds);
            if (newSelection.has(fileId)) {
                newSelection.delete(fileId);
            } else {
                newSelection.add(fileId);
            }
            return { selectedFileIds: newSelection };
        }),

    selectAll: () =>
        set((state) => ({
            selectedFileIds: new Set(state.visibleFileIds),
        })),

    clearSelection: () => set({ selectedFileIds: new Set() }),

    setViewMode: (mode) => set({ viewMode: mode }),

    setShowOnlyMatches: (show) => set({ showOnlyMatches: show }),

    setSorting: (sortBy, order) => set({ sortBy, sortOrder: order }),

    reset: () => set({
        visibleFileIds: [],
        selectedFileIds: new Set(),
        viewMode: 'grid',
        showOnlyMatches: false,
        sortBy: 'timestamp',
        sortOrder: 'desc',
    }),
}));
