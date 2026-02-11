/**
 * Global Constants for OAT Application
 */

// Face detection thresholds
export const FACE_DETECTION = {
    SIMILARITY_THRESHOLD: 0.6, // Euclidean distance threshold
    MIN_FACE_SIZE: 50,         // Minimum face size in pixels
    MAX_FACE_SIZE: 800,        // Maximum face size in pixels
} as const;

// Google Drive API
export const GOOGLE_DRIVE = {
    MAX_CONCURRENT_REQUESTS: 3,
    RETRY_ATTEMPTS: 3,
    BACKOFF_MULTIPLIER: 2, // Exponential backoff: 1s, 2s, 4s
    INITIAL_RETRY_DELAY: 1000, // 1 second
} as const;

// File processing
export const FILE_PROCESSING = {
    SUPPORTED_IMAGE_TYPES: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/heic',
    ],
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    THUMBNAIL_SIZE: 400, // px
    CHUNK_SIZE: 50, // Process N files at a time
} as const;

// OPFS (Origin Private File System)
export const STORAGE = {
    OPFS_ROOT: 'oat-photos',
    OPFS_THUMBNAILS: 'thumbnails',
    OPFS_ORIGINALS: 'originals',
} as const;

// IndexedDB
export const DB_NAME = 'oat-db';
export const DB_VERSION = 1;

// App metadata
export const APP = {
    NAME: 'OAT',
    FULL_NAME: 'Offline Album Tidy',
    TAGLINE: 'Sift the noise. Keep the memories.',
    VERSION: '1.0.0',
} as const;
