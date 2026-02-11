import { wrap } from 'comlink';

/**
 * Face Detector Service
 * Main thread wrapper for the Face Scanner worker
 */

// Create worker instance
const worker = new Worker(
    new URL('../../workers/face-scanner.ts', import.meta.url),
    { type: 'module' }
);

// Wrap with Comlink to get typed async interface
export const faceScanner = wrap<import('../../workers/face-scanner').FaceScannerAPI>(worker);
