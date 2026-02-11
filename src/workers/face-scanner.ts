/**
 * Web Worker for Face Detection using MediaPipe
 * 
 * CRITICAL: This runs in a separate thread to prevent UI blocking.
 * MediaPipe AI processing is CPU-intensive and would freeze the main thread.
 * 
 * Communication happens via Comlink (makes workers feel like regular async functions)
 */

import { FilesetResolver, FaceLandmarker, type FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import type { FaceDetectionResult, FaceComparisonResult } from '../types';

let faceLandmarker: FaceLandmarker | null = null;

/**
 * Initialize MediaPipe Face Landmarker
 */
export async function initialize(): Promise<{ success: boolean; message: string }> {
    try {
        console.log('🔧 Initializing MediaPipe...');

        const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                delegate: 'GPU',
            },
            runningMode: 'IMAGE',
            numFaces: 1,
            minFaceDetectionConfidence: 0.5,
            minFacePresenceConfidence: 0.5,
        });

        console.log('✅ MediaPipe initialized successfully');
        return { success: true, message: 'MediaPipe ready' };
    } catch (error: any) {
        console.error('❌ MediaPipe initialization failed:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Detect face in an image and extract embedding
 * @param imageBlob - The image as a Blob
 */
export async function detectFace(imageBlob: Blob): Promise<FaceDetectionResult> {
    if (!faceLandmarker) {
        throw new Error('FaceLandmarker not initialized. Call initialize() first.');
    }

    try {
        // Convert Blob to ImageBitmap
        const imageBitmap = await createImageBitmap(imageBlob);

        // Detect faces
        const result: FaceLandmarkerResult = faceLandmarker.detect(imageBitmap);

        // Close the bitmap to free memory
        imageBitmap.close();

        if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
            return {
                hasFace: false,
            };
        }

        // Extract face landmarks (468 points)
        const landmarks = result.faceLandmarks[0];

        // Generate simple embedding (this is a simplified version)
        // In production, you might want to use a proper face recognition model
        const embedding = extractEmbedding(landmarks);

        // Get bounding box
        const boundingBox = calculateBoundingBox(landmarks);

        return {
            hasFace: true,
            embedding,
            confidence: 0.9, // MediaPipe doesn't provide confidence directly
            boundingBox,
        };
    } catch (error: any) {
        console.error('❌ Face detection failed:', error);
        return {
            hasFace: false,
        };
    }
}

/**
 * Compare two face embeddings
 * @param embedding1 - First face embedding
 * @param embedding2 - Second face embedding
 * @returns Comparison result with distance and match status
 */
export function compareFaces(embedding1: number[], embedding2: number[]): FaceComparisonResult {
    if (embedding1.length !== embedding2.length) {
        throw new Error('Embeddings must have the same length');
    }

    // Calculate Euclidean distance
    const distance = euclideanDistance(embedding1, embedding2);

    // Threshold from constants (0.6)
    const THRESHOLD = 0.6;
    const isMatch = distance < THRESHOLD;

    // Convert distance to confidence (inverse relationship)
    const confidence = Math.max(0, 1 - distance);

    return {
        isMatch,
        distance,
        confidence,
    };
}

/**
 * Extract a simple embedding from face landmarks
 * (Simplified version - in production, use a proper face recognition model)
 */
function extractEmbedding(landmarks: any[]): number[] {
    // Take key points and normalize
    const keyPoints = [
        0, 10, 152, 234, 454, // Outline
        33, 133, 362, 263,    // Eyes
        1, 4, 5, 195, 197,    // Nose
        61, 291, 39, 269,     // Mouth
    ];

    const embedding: number[] = [];

    for (const idx of keyPoints) {
        if (landmarks[idx]) {
            embedding.push(landmarks[idx].x);
            embedding.push(landmarks[idx].y);
            embedding.push(landmarks[idx].z || 0);
        }
    }

    // Normalize to 128 dimensions by padding/truncating
    while (embedding.length < 128) {
        embedding.push(0);
    }

    return embedding.slice(0, 128);
}

/**
 * Calculate bounding box from landmarks
 */
function calculateBoundingBox(landmarks: any[]) {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const point of landmarks) {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
    }

    return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
    };
}

/**
 * Calculate Euclidean distance between two vectors
 */
function euclideanDistance(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        sum += Math.pow(a[i] - b[i], 2);
    }
    return Math.sqrt(sum);
}

// Expose functions via Comlink
const exports = {
    initialize,
    detectFace,
    compareFaces,
};

export type FaceScannerWorker = typeof exports;
