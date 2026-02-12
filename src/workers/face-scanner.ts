/**
 * Web Worker for Face Detection using MediaPipe
 * 
 * Runs in a separate thread to prevent UI blocking.
 * Communication happens via Comlink.
 */

import { expose } from 'comlink';
import { FilesetResolver, FaceLandmarker, type FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import type { FaceDetectionResult, FaceComparisonResult } from '../types';

let faceLandmarker: FaceLandmarker | null = null;

/**
 * Initialize MediaPipe Face Landmarker
 */
async function initialize(): Promise<{ success: boolean; message: string }> {
    try {
        console.log('⚙️ [WORKER] Initializing MediaPipe Face Landmarker...');

        const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath:
                    'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                delegate: 'GPU',
            },
            runningMode: 'IMAGE',
            numFaces: 1,
            minFaceDetectionConfidence: 0.5,
            minFacePresenceConfidence: 0.5,
        });

        console.log('✅ [WORKER] MediaPipe Face Landmarker ready');
        return { success: true, message: 'MediaPipe ready' };
    } catch (error: any) {
        console.error('❌ [WORKER] MediaPipe initialization failed:', error);
        return { success: false, message: error.message };
    }
}

/**
 * Detect face in an image and extract embedding
 */
async function detectFace(imageBlob: Blob): Promise<FaceDetectionResult> {
    if (!faceLandmarker) {
        throw new Error('FaceLandmarker not initialized. Call initialize() first.');
    }

    try {
        console.log('⚙️ [WORKER] Detecting face in image...');

        const imageBitmap = await createImageBitmap(imageBlob);
        const result: FaceLandmarkerResult = faceLandmarker.detect(imageBitmap);
        imageBitmap.close();

        if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
            console.warn('⚠️ [WORKER] No face detected in image');
            return { hasFace: false };
        }

        const landmarks = result.faceLandmarks[0];
        const embedding = extractEmbedding(landmarks);
        const boundingBox = calculateBoundingBox(landmarks);

        console.log('✅ [WORKER] Face detected, embedding extracted (128-dim)');
        return {
            hasFace: true,
            embedding,
            confidence: 0.9,
            boundingBox,
        };
    } catch (error: any) {
        console.error('❌ [WORKER] Face detection failed:', error);
        return { hasFace: false };
    }
}

/**
 * Compare two face embeddings
 */
function compareFaces(embedding1: number[], embedding2: number[]): FaceComparisonResult {
    if (embedding1.length !== embedding2.length) {
        throw new Error('Embeddings must have the same length');
    }

    const distance = euclideanDistance(embedding1, embedding2);
    const THRESHOLD = 0.6;
    const isMatch = distance < THRESHOLD;
    const confidence = Math.max(0, 1 - distance);

    console.log(`⚙️ [WORKER] Face comparison: distance=${distance.toFixed(3)}, match=${isMatch}`);

    return { isMatch, distance, confidence };
}

// --- Helper Functions ---

function extractEmbedding(landmarks: any[]): number[] {
    const keyPoints = [
        0, 10, 152, 234, 454,
        33, 133, 362, 263,
        1, 4, 5, 195, 197,
        61, 291, 39, 269,
    ];

    const embedding: number[] = [];
    for (const idx of keyPoints) {
        if (landmarks[idx]) {
            embedding.push(landmarks[idx].x);
            embedding.push(landmarks[idx].y);
            embedding.push(landmarks[idx].z || 0);
        }
    }

    while (embedding.length < 128) {
        embedding.push(0);
    }

    return embedding.slice(0, 128);
}

function calculateBoundingBox(landmarks: any[]) {
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const point of landmarks) {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
    }

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

function euclideanDistance(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        sum += Math.pow(a[i] - b[i], 2);
    }
    return Math.sqrt(sum);
}

// --- Expose to main thread via Comlink ---
const api = { initialize, detectFace, compareFaces };
export type FaceScannerAPI = typeof api;
expose(api);
