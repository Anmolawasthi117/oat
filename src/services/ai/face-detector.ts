/**
 * Face Detector Service — Hybrid Architecture
 * 
 * DETECTION:   face-api.js SSD MobileNet v1 (finds faces, gives bounding boxes)
 * RECOGNITION: MobileFaceNet via ONNX Runtime Web (512-dim ArcFace embeddings)
 * MATCHING:    Cosine similarity (standard for ArcFace-family models)
 * 
 * This hybrid gives us:
 * - SSD MobileNet's reliable face detection
 * - MobileFaceNet's 99.5% LFW accuracy (vs face-api.js's 99.38%)
 * - 512-dim embeddings (vs 128-dim) for better identity separation
 */

import * as faceapi from 'face-api.js';
import * as ort from 'onnxruntime-web';
import type { FaceDetectionResult, FaceComparisonResult } from '../../types';
import { log } from '../../lib/logger';

// face-api.js models from CDN (for detection only)
const FACEAPI_MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';

// MobileFaceNet ONNX model (for recognition)
const MOBILEFACENET_MODEL_PATH = '/models/w600k_mbf.onnx';

let detectionModelsLoaded = false;
let recognitionSession: ort.InferenceSession | null = null;

/**
 * Initialize both detection (face-api.js) and recognition (MobileFaceNet ONNX) models
 */
async function initialize(): Promise<{ success: boolean; message: string }> {
    if (detectionModelsLoaded && recognitionSession) {
        log.ai.info('Models already loaded, skipping');
        return { success: true, message: 'Already initialized' };
    }

    try {
        log.ai.info('Loading face detection + recognition models...');

        // Load in parallel: face-api.js detection + ONNX recognition
        const [, session] = await Promise.all([
            // 1. face-api.js — SSD MobileNet for detection + landmarks for alignment
            loadDetectionModels(),
            // 2. MobileFaceNet — ONNX for 512-dim recognition embeddings
            loadRecognitionModel(),
        ]);

        recognitionSession = session;
        detectionModelsLoaded = true;

        log.ai.success('Models loaded: SSD MobileNet (detect) + MobileFaceNet (recognize, 512-dim)');
        return { success: true, message: 'Hybrid face system ready' };
    } catch (error: any) {
        log.ai.error('Model loading failed', error.message);
        return { success: false, message: error.message };
    }
}

async function loadDetectionModels(): Promise<void> {
    if (detectionModelsLoaded) return;

    await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(FACEAPI_MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(FACEAPI_MODEL_URL),
    ]);
    log.ai.info('Detection models loaded (SSD MobileNet + Landmarks)');
}

async function loadRecognitionModel(): Promise<ort.InferenceSession> {
    if (recognitionSession) return recognitionSession;

    // ONNX Runtime WASM files from CDN — Vite can't serve .mjs from public/ correctly
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.24.1/dist/';

    // Fetch the model as ArrayBuffer (avoids Vite intercepting the request)
    log.ai.info('Fetching MobileFaceNet ONNX model...');
    const response = await fetch(MOBILEFACENET_MODEL_PATH);
    if (!response.ok) throw new Error(`Failed to fetch model: ${response.status}`);
    const modelBuffer = await response.arrayBuffer();

    const session = await ort.InferenceSession.create(modelBuffer, {
        executionProviders: ['wasm'],
        graphOptimizationLevel: 'all',
    });

    log.ai.info(`MobileFaceNet ONNX loaded (inputs: ${session.inputNames}, outputs: ${session.outputNames})`);
    return session;
}

/**
 * Detect a single face and extract 512-dim MobileFaceNet embedding
 */
async function detectFace(imageSource: Blob | HTMLImageElement): Promise<FaceDetectionResult> {
    if (!detectionModelsLoaded || !recognitionSession) {
        throw new Error('Models not loaded. Call initialize() first.');
    }

    try {
        log.ai.info('Detecting face (SSD MobileNet → MobileFaceNet)...');

        const image = imageSource instanceof Blob ? await blobToImage(imageSource) : imageSource;

        // Step 1: Detect face with SSD MobileNet (face-api.js)
        const detection = await faceapi
            .detectSingleFace(image, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 }))
            .withFaceLandmarks();

        if (!detection) {
            log.ai.warn('No face detected in image');
            return { hasFace: false };
        }

        const box = detection.detection.box;
        const score = detection.detection.score;

        // Step 2: Crop face and preprocess for MobileFaceNet (112x112, CHW, normalized)
        const inputTensor = await cropAndPreprocess(image, box);

        // Step 3: Run MobileFaceNet to get 512-dim embedding
        const embedding = await runRecognition(inputTensor);

        log.ai.success(`Face detected! 512-dim MobileFaceNet embedding, detection score: ${score.toFixed(2)}`);

        return {
            hasFace: true,
            embedding,
            confidence: score,
            boundingBox: { x: box.x, y: box.y, width: box.width, height: box.height },
        };
    } catch (error: any) {
        log.ai.error('Face detection failed', error.message);
        return { hasFace: false };
    }
}

/**
 * Detect ALL faces in an image and return results with 512-dim embeddings
 */
async function detectAllFaces(imageSource: Blob | HTMLImageElement): Promise<FaceDetectionResult[]> {
    if (!detectionModelsLoaded || !recognitionSession) {
        throw new Error('Models not loaded. Call initialize() first.');
    }

    try {
        const image = imageSource instanceof Blob ? await blobToImage(imageSource) : imageSource;

        // Detect all faces
        const detections = await faceapi
            .detectAllFaces(image, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.4 }))
            .withFaceLandmarks();

        if (detections.length === 0) {
            return [];
        }

        // Process each detected face through MobileFaceNet
        const results: FaceDetectionResult[] = [];

        for (const det of detections) {
            try {
                const box = det.detection.box;
                const inputTensor = await cropAndPreprocess(image, box);
                const embedding = await runRecognition(inputTensor);

                results.push({
                    hasFace: true,
                    embedding,
                    confidence: det.detection.score,
                    boundingBox: { x: box.x, y: box.y, width: box.width, height: box.height },
                });
            } catch {
                // Skip faces that fail to process
                continue;
            }
        }

        return results;
    } catch (error: any) {
        log.ai.error('Multi-face detection failed', error.message);
        return [];
    }
}

/**
 * Crop face region from image and preprocess for MobileFaceNet
 * Input must be: [1, 3, 112, 112] — batch=1, RGB channels, 112x112 pixels
 * Pixel values normalized to [-1, +1]
 */
async function cropAndPreprocess(
    image: HTMLImageElement,
    box: { x: number; y: number; width: number; height: number }
): Promise<ort.Tensor> {
    const canvas = document.createElement('canvas');
    canvas.width = 112;
    canvas.height = 112;
    const ctx = canvas.getContext('2d')!;

    // Add 20% padding around the face for better recognition
    const padding = 0.2;
    const padX = box.width * padding;
    const padY = box.height * padding;

    const sx = Math.max(0, box.x - padX);
    const sy = Math.max(0, box.y - padY);
    const sw = Math.min(image.width - sx, box.width + padX * 2);
    const sh = Math.min(image.height - sy, box.height + padY * 2);

    // Draw cropped + resized face
    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, 112, 112);

    // Get pixel data
    const imageData = ctx.getImageData(0, 0, 112, 112);
    const { data } = imageData;

    // Convert to CHW format with normalization: (pixel / 127.5) - 1.0 → range [-1, +1]
    const floatData = new Float32Array(1 * 3 * 112 * 112);
    for (let y = 0; y < 112; y++) {
        for (let x = 0; x < 112; x++) {
            const pixelIdx = (y * 112 + x) * 4; // RGBA
            const tensorIdx = y * 112 + x;

            // CHW layout: [R_plane, G_plane, B_plane]
            floatData[0 * 112 * 112 + tensorIdx] = (data[pixelIdx + 0] / 127.5) - 1.0; // R
            floatData[1 * 112 * 112 + tensorIdx] = (data[pixelIdx + 1] / 127.5) - 1.0; // G
            floatData[2 * 112 * 112 + tensorIdx] = (data[pixelIdx + 2] / 127.5) - 1.0; // B
        }
    }

    return new ort.Tensor('float32', floatData, [1, 3, 112, 112]);
}

/**
 * Run MobileFaceNet inference to get 512-dim face embedding
 */
async function runRecognition(inputTensor: ort.Tensor): Promise<number[]> {
    if (!recognitionSession) throw new Error('Recognition model not loaded');

    const inputName = recognitionSession.inputNames[0];
    const feeds: Record<string, ort.Tensor> = { [inputName]: inputTensor };

    const results = await recognitionSession.run(feeds);
    const outputName = recognitionSession.outputNames[0];
    const output = results[outputName];

    // L2 normalize the embedding (standard for ArcFace)
    const rawEmbedding = Array.from(output.data as Float32Array);
    const norm = Math.sqrt(rawEmbedding.reduce((sum, v) => sum + v * v, 0));
    const normalized = rawEmbedding.map(v => v / norm);

    return normalized;
}

/**
 * Compare two face embeddings using cosine similarity
 * ArcFace-family models use cosine similarity (not Euclidean distance)
 * Threshold: > 0.4 = likely same person (after L2 normalization)
 */
function compareFaces(embedding1: number[], embedding2: number[]): FaceComparisonResult {
    // Cosine similarity: dot product of L2-normalized vectors
    let dotProduct = 0;
    for (let i = 0; i < embedding1.length; i++) {
        dotProduct += embedding1[i] * embedding2[i];
    }
    const similarity = dotProduct; // Already L2-normalized, so this IS cosine similarity

    // Also compute Euclidean distance for logging
    let sumSq = 0;
    for (let i = 0; i < embedding1.length; i++) {
        const diff = embedding1[i] - embedding2[i];
        sumSq += diff * diff;
    }
    const distance = Math.sqrt(sumSq);

    // Threshold: cosine similarity > 0.28 = same person
    // Lower threshold favors RECALL (finding all user's photos) over precision
    // MobileFaceNet's 512-dim embeddings keep false positives low even at this threshold
    // Users want ALL their photos — missing ones is worse than 1-2 extras
    const THRESHOLD = 0.28;
    const isMatch = similarity > THRESHOLD;
    const confidence = Math.max(0, Math.min(1, similarity));

    log.ai.info(`Face match: similarity=${similarity.toFixed(3)}, distance=${distance.toFixed(3)}, threshold=${THRESHOLD}, match=${isMatch}`);

    return { isMatch, distance, similarity, confidence };
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
    detectAllFaces,
    compareFaces,
};
