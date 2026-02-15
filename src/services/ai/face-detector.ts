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
        log.ai.info('Detecting face (SSD MobileNet → aligned → MobileFaceNet)...');

        const image = imageSource instanceof Blob ? await blobToImage(imageSource) : imageSource;

        // Step 1: Detect face with SSD MobileNet + 68-point landmarks
        const detection = await faceapi
            .detectSingleFace(image, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
            .withFaceLandmarks();

        if (!detection) {
            log.ai.warn('No face detected in image');
            return { hasFace: false };
        }

        const box = detection.detection.box;
        const score = detection.detection.score;

        // Step 2: Align face using 5-point landmarks → 112x112 (ArcFace standard)
        const inputTensor = await alignAndPreprocess(image, detection.landmarks);

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

        // Detect all faces with landmarks
        const detections = await faceapi
            .detectAllFaces(image, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
            .withFaceLandmarks();

        if (detections.length === 0) {
            return [];
        }

        const results: FaceDetectionResult[] = [];

        for (const det of detections) {
            try {
                const box = det.detection.box;
                // Use landmark-aligned preprocessing
                const inputTensor = await alignAndPreprocess(image, det.landmarks);
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

// ─── ArcFace Standard 5-point Template for 112x112 ─────────────────────
// Canonical landmark positions used during InsightFace/ArcFace model training.
// Source: insightface/python-package/insightface/utils/face_align.py
const ARCFACE_112_TEMPLATE: [number, number][] = [
    [38.2946, 51.6963],  // Left eye center
    [73.5318, 51.5014],  // Right eye center
    [56.0252, 71.7366],  // Nose tip
    [41.5493, 92.3655],  // Left mouth corner
    [70.7299, 92.2041],  // Right mouth corner
];

/**
 * Extract 5-point landmarks from face-api.js 68-point landmarks.
 * Maps: left eye center, right eye center, nose tip, left mouth, right mouth.
 */
function extract5Points(landmarks: faceapi.FaceLandmarks68): [number, number][] {
    const pts = landmarks.positions;
    // Left eye: average of points 36-41
    const le = pts.slice(36, 42);
    const leftEye: [number, number] = [
        le.reduce((s, p) => s + p.x, 0) / le.length,
        le.reduce((s, p) => s + p.y, 0) / le.length,
    ];
    // Right eye: average of points 42-47
    const re = pts.slice(42, 48);
    const rightEye: [number, number] = [
        re.reduce((s, p) => s + p.x, 0) / re.length,
        re.reduce((s, p) => s + p.y, 0) / re.length,
    ];
    // Nose tip: point 30
    const nose: [number, number] = [pts[30].x, pts[30].y];
    // Left mouth corner: point 48
    const leftMouth: [number, number] = [pts[48].x, pts[48].y];
    // Right mouth corner: point 54
    const rightMouth: [number, number] = [pts[54].x, pts[54].y];

    return [leftEye, rightEye, nose, leftMouth, rightMouth];
}

/**
 * Compute a similarity transform (rotation + uniform scale + translation)
 * that maps src points to dst points using least-squares.
 * Returns [a, b, tx, ty] where the transform matrix is:
 *   [ a, -b, tx ]
 *   [ b,  a, ty ]
 */
function estimateSimilarityTransform(
    src: [number, number][],
    dst: [number, number][]
): [number, number, number, number] {
    const n = src.length;
    let srcMeanX = 0, srcMeanY = 0, dstMeanX = 0, dstMeanY = 0;

    for (let i = 0; i < n; i++) {
        srcMeanX += src[i][0]; srcMeanY += src[i][1];
        dstMeanX += dst[i][0]; dstMeanY += dst[i][1];
    }
    srcMeanX /= n; srcMeanY /= n; dstMeanX /= n; dstMeanY /= n;

    let num1 = 0, num2 = 0, den = 0;
    for (let i = 0; i < n; i++) {
        const sx = src[i][0] - srcMeanX;
        const sy = src[i][1] - srcMeanY;
        const dx = dst[i][0] - dstMeanX;
        const dy = dst[i][1] - dstMeanY;
        num1 += dx * sx + dy * sy;
        num2 += dx * sy - dy * sx;
        den += sx * sx + sy * sy;
    }

    const a = num1 / den;
    const b = num2 / den;
    const tx = dstMeanX - a * srcMeanX + b * srcMeanY;
    const ty = dstMeanY - b * srcMeanX - a * srcMeanY;
    return [a, b, tx, ty];
}

/**
 * Align face using landmark-based similarity transform and preprocess for MobileFaceNet.
 * Standard InsightFace alignment:
 * 1. Extract 5 key landmarks from 68-point detection
 * 2. Compute similarity transform to ArcFace 112x112 template
 * 3. Warp the original image using the transform
 * 4. Normalize pixels to [-1, +1] in CHW format
 */
async function alignAndPreprocess(
    image: HTMLImageElement,
    landmarks: faceapi.FaceLandmarks68
): Promise<ort.Tensor> {
    const src5 = extract5Points(landmarks);
    const [a, b, tx, ty] = estimateSimilarityTransform(src5, ARCFACE_112_TEMPLATE);

    const canvas = document.createElement('canvas');
    canvas.width = 112;
    canvas.height = 112;
    const ctx = canvas.getContext('2d')!;

    // Apply the similarity transform via canvas setTransform
    // This warps the source face to the aligned 112x112 layout
    ctx.setTransform(a, b, -b, a, tx, ty);
    ctx.drawImage(image, 0, 0);

    // Reset transform and extract pixel data
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const imageData = ctx.getImageData(0, 0, 112, 112);
    const { data } = imageData;

    // Convert to CHW format with normalization: (pixel / 127.5) - 1.0 → range [-1, +1]
    const floatData = new Float32Array(1 * 3 * 112 * 112);
    for (let y = 0; y < 112; y++) {
        for (let x = 0; x < 112; x++) {
            const pixelIdx = (y * 112 + x) * 4;
            const tensorIdx = y * 112 + x;
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

    // Threshold: cosine similarity > 0.45 = same person
    // Balanced for PRECISION — users expect correct matches, not dozens of false positives
    // MobileFaceNet's 512-dim ArcFace embeddings separate identities well above this threshold
    const THRESHOLD = 0.45;
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
