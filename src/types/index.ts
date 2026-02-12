/**
 * Global TypeScript Type Definitions for OAT
 */

// ==================== Photo & File Types ====================

export interface PhotoMetadata {
    id: string;              // Unique file ID
    opfsPath: string;        // Path in OPFS
    filename: string;        // Original filename
    timestamp: number;       // Unix timestamp
    size: number;            // File size in bytes
    mimeType: string;        // MIME type
    hasFace: boolean;        // Whether a face was detected
    isMatch: boolean;        // Whether face matches reference
    faceConfidence?: number; // Similarity score (0-1)
    source: 'local' | 'drive'; // Source of the photo
    driveId?: string;        // Google Drive file ID (if from Drive)
    processed: boolean;      // Whether AI processing is complete
}

export interface FaceEmbedding {
    embedding: number[];     // 512-dimensional vector from MobileFaceNet
    timestamp: number;       // When it was created
}

// ==================== User & Auth Types ====================

export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}

export type AuthMode = 'guest' | 'authenticated';

// ==================== Processing States ====================

export type ProcessingStatus =
    | 'idle'
    | 'uploading'
    | 'calibrating'
    | 'processing'
    | 'complete'
    | 'error';

export interface ProcessingState {
    status: ProcessingStatus;
    totalFiles: number;
    processedFiles: number;
    matchedFiles: number;
    progress: number; // 0-100
    error?: string;
}

// ==================== Google Drive Types ====================

export interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    size: string;
    thumbnailLink?: string;
    webContentLink?: string;
    createdTime: string;
}

export interface DrivePickerResult {
    action: 'picked' | 'cancel';
    docs?: DriveFile[];
}

// ==================== Worker Messages ====================

export interface WorkerRequest {
    type: 'initialize' | 'detectFace' | 'compareFaces';
    payload: any;
}

export interface WorkerResponse {
    type: 'initialized' | 'faceDetected' | 'comparison';
    success: boolean;
    data?: any;
    error?: string;
}

export interface FaceDetectionResult {
    hasFace: boolean;
    embedding?: number[];
    confidence?: number;
    boundingBox?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

export interface FaceComparisonResult {
    isMatch: boolean;
    distance: number;
    similarity: number;     // cosine similarity (0-1, higher = more similar)
    confidence: number;
}

// ==================== Export Types ====================

export interface ExportOptions {
    format: 'zip' | 'drive';
    folderName?: string;
    includeMetadata?: boolean;
}

export interface ExportProgress {
    current: number;
    total: number;
    filename: string;
}
