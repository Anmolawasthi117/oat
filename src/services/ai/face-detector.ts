/**
 * Face Detector Service — Using face-api.js
 * 
 * Uses face-api.js with ResNet-34 FaceNet model for REAL face recognition.
 * MediaPipe FaceLandmarker only gives geometry (landmark positions) which
 * change with pose/lighting — terrible for identity matching.
 * 
 * face-api.js gives us real 128-dimensional FaceNet descriptors
 * that represent facial IDENTITY, not geometry.
 */

import * as faceapi from 'face-api.js';
import type { FaceDetectionResult, FaceComparisonResult } from '../../types';
import { log } from '../../lib/logger';

const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';

let modelsLoaded = false;

async function initialize(): Promise<{ success: boolean; message: string }> {
    if (modelsLoaded) {
        log.ai.info('face-api.js already loaded, skipping');
        return { success: true, message: 'Already initialized' };
    }

    try {
        log.ai.info('Loading face-api.js models from CDN...');

        // Load the 3 models we need:
        // 1. TinyFaceDetector — fast face detection
        // 2. FaceLandmark68Net — 68-point landmarks (for alignment)
        // 3. FaceRecognitionNet — 128-dim FaceNet descriptor (for identity matching)
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);

        modelsLoaded = true;
        log.ai.success('face-api.js models loaded (TinyFaceDetector + Landmarks + FaceRecognition)');
        return { success: true, message: 'face-api.js ready' };
    } catch (error: any) {
        log.ai.error('face-api.js model loading failed', error.message);
        return { success: false, message: error.message };
    }
}

async function detectFace(imageSource: Blob | HTMLImageElement): Promise<FaceDetectionResult> {
    if (!modelsLoaded) {
        throw new Error('Models not loaded. Call initialize() first.');
    }

    try {
        log.ai.info('Detecting face with face-api.js...');

        let image: HTMLImageElement;

        if (imageSource instanceof Blob) {
            image = await blobToImage(imageSource);
        } else {
            image = imageSource;
        }

        // Detect face + landmarks + descriptor
        const detection = await faceapi
            .detectSingleFace(image, new faceapi.TinyFaceDetectorOptions({
                inputSize: 416,
                scoreThreshold: 0.5,
            }))
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection) {
            log.ai.warn('No face detected in image');
            return { hasFace: false };
        }

        // The descriptor is a Float32Array of 128 values — real FaceNet embedding
        const embedding = Array.from(detection.descriptor);
        const box = detection.detection.box;

        log.ai.success(`Face detected! Descriptor: 128-dim FaceNet embedding, score: ${detection.detection.score.toFixed(2)}`);

        return {
            hasFace: true,
            embedding,
            confidence: detection.detection.score,
            boundingBox: {
                x: box.x,
                y: box.y,
                width: box.width,
                height: box.height,
            },
        };
    } catch (error: any) {
        log.ai.error('Face detection failed', error.message);
        return { hasFace: false };
    }
}

function compareFaces(embedding1: number[], embedding2: number[]): FaceComparisonResult {
    // face-api.js uses Euclidean distance on FaceNet descriptors
    // Typical thresholds: < 0.6 = same person
    const distance = faceapi.euclideanDistance(
        new Float32Array(embedding1),
        new Float32Array(embedding2)
    );

    const THRESHOLD = 0.6;
    const isMatch = distance < THRESHOLD;
    const confidence = Math.max(0, Math.min(1, 1 - distance));

    log.ai.info(`Face comparison: distance=${distance.toFixed(3)}, threshold=${THRESHOLD}, match=${isMatch}`);

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

// Export as a simple service
export const faceScanner = {
    initialize,
    detectFace,
    compareFaces,
};
