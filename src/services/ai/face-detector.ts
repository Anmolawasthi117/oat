import { wrap } from 'comlink';
import type { FaceScannerAPI } from '../../workers/face-scanner';

/**
 * Face Detector Service
 * Main thread wrapper for the Face Scanner Web Worker
 */

const worker = new Worker(
    new URL('../../workers/face-scanner.ts', import.meta.url),
    { type: 'module' }
);

export const faceScanner = wrap<FaceScannerAPI>(worker);
