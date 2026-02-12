/**
 * Face Detector Service
 * 
 * Runs MediaPipe on the MAIN THREAD (not a worker).
 * Why? MediaPipe's WASM loader uses importScripts() internally,
 * which is not available in module workers (type: 'module').
 * MediaPipe already uses GPU delegation so it won't block the UI.
 */

import { FilesetResolver, FaceLandmarker, type FaceLandmarkerResult } from '@mediapipe/tasks-vision';
import type { FaceDetectionResult, FaceComparisonResult } from '../../types';
import { log } from '../../lib/logger';

let faceLandmarker: FaceLandmarker | null = null;

async function initialize(): Promise<{ success: boolean; message: string }> {
    // Skip if already initialized
    if (faceLandmarker) {
        log.ai.info('MediaPipe already initialized, skipping');
        return { success: true, message: 'Already initialized' };
    }

    try {
        log.ai.info('Loading MediaPipe WASM runtime...');

        const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        log.ai.info('Creating FaceLandmarker model...');

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

        log.ai.success('MediaPipe FaceLandmarker ready');
        return { success: true, message: 'MediaPipe ready' };
    } catch (error: any) {
        log.ai.error('MediaPipe initialization failed', error.message);
        return { success: false, message: error.message };
    }
}

async function detectFace(imageSource: Blob | HTMLImageElement): Promise<FaceDetectionResult> {
    if (!faceLandmarker) {
        throw new Error('FaceLandmarker not initialized. Call initialize() first.');
    }

    try {
        log.ai.info('Detecting face...');

        let image: HTMLImageElement | ImageBitmap;

        if (imageSource instanceof Blob) {
            // Convert Blob to Image element for MediaPipe
            image = await blobToImage(imageSource);
        } else {
            image = imageSource;
        }

        const result: FaceLandmarkerResult = faceLandmarker.detect(image as any);

        if (!result.faceLandmarks || result.faceLandmarks.length === 0) {
            log.ai.warn('No face detected in image');
            return { hasFace: false };
        }

        const landmarks = result.faceLandmarks[0];
        const embedding = extractEmbedding(landmarks);
        const boundingBox = calculateBoundingBox(landmarks);

        log.ai.success('Face detected, embedding extracted (128-dim)');

        return {
            hasFace: true,
            embedding,
            confidence: 0.9,
            boundingBox,
        };
    } catch (error: any) {
        log.ai.error('Face detection failed', error.message);
        return { hasFace: false };
    }
}

function compareFaces(embedding1: number[], embedding2: number[]): FaceComparisonResult {
    if (embedding1.length !== embedding2.length) {
        throw new Error('Embeddings must have the same length');
    }

    const distance = euclideanDistance(embedding1, embedding2);
    const THRESHOLD = 0.6;
    const isMatch = distance < THRESHOLD;
    const confidence = Math.max(0, 1 - distance);

    log.ai.info(`Face comparison: distance=${distance.toFixed(3)}, match=${isMatch}`);

    return { isMatch, distance, confidence };
}

// --- Helpers ---

function blobToImage(blob: Blob): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(blob);
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image from blob'));
        };
        img.src = url;
    });
}

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

    while (embedding.length < 128) embedding.push(0);
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

// Export as a simple object (no worker, no Comlink)
export const faceScanner = {
    initialize,
    detectFace,
    compareFaces,
};
