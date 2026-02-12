/**
 * Processing Pipeline Service
 * 
 * Orchestrates: load file from OPFS → detect face → compare with reference → update DB
 * Uses requestIdleCallback between photos to keep UI responsive.
 */

import { opfsManager } from '../opfs/opfs-manager';
import { faceScanner } from '../ai/face-detector';
import { dbHelpers, db } from '../../lib/dexie';
import { useProcessingStore } from '../../store/processing';
import { useAuthStore } from '../../store/auth';
import { log } from '../../lib/logger';
import type { PhotoMetadata } from '../../types';

class ProcessingPipeline {
    private cancelled = false;
    private initialized = false;

    /**
     * Initialize MediaPipe (once)
     */
    async initialize(): Promise<boolean> {
        if (this.initialized) return true;

        log.ai.info('Initializing processing pipeline...');
        const result = await faceScanner.initialize();
        if (result.success) {
            this.initialized = true;
            log.ai.success('Pipeline ready');
        } else {
            log.ai.error('Pipeline init failed', result.message);
        }
        return result.success;
    }

    /**
     * Process all unprocessed photos
     */
    async processAll(): Promise<void> {
        this.cancelled = false;
        const store = useProcessingStore.getState();
        const authStore = useAuthStore.getState();

        // Get reference embedding — extract the number[] from the FaceEmbedding object
        const refData = authStore.referenceFaceEmbedding;
        if (!refData || !refData.embedding) {
            store.setError('No reference face set. Please calibrate first.');
            log.ai.error('No reference embedding found');
            return;
        }

        const referenceEmbedding = refData.embedding;
        log.ai.info(`Reference embedding: ${referenceEmbedding.length} dimensions`);

        // Validate it's a 512-dim MobileFaceNet embedding (not old 128-dim FaceNet)
        if (referenceEmbedding.length !== 512) {
            store.setError(`Stale calibration data (${referenceEmbedding.length} dims, need 512). Please re-calibrate.`);
            log.ai.error(`Reference embedding has wrong dimensions: ${referenceEmbedding.length} (expected 512). User needs to re-calibrate.`);
            return;
        }

        // Init MediaPipe
        store.setStatus('calibrating');
        const ready = await this.initialize();
        if (!ready) {
            store.setError('Failed to load face detection model');
            return;
        }

        // Get all unprocessed photos
        // NOTE: IndexedDB can't index booleans (false !== 0), so we filter in JS
        const allPhotos = await db.photos.toArray();
        const photos = allPhotos.filter(p => !p.processed);
        if (photos.length === 0) {
            log.ai.info('No unprocessed photos found');
            store.setStatus('complete');
            return;
        }

        store.setTotalFiles(photos.length);
        store.setStatus('processing');
        log.ai.info(`Processing ${photos.length} photos...`);

        for (let i = 0; i < photos.length; i++) {
            if (this.cancelled) {
                log.ai.warn('Processing cancelled by user');
                store.setStatus('idle');
                return;
            }

            const photo = photos[i];
            store.setCurrentFile(photo.id);

            try {
                await this.processPhoto(photo, referenceEmbedding);
                store.incrementProcessed();
            } catch (err: any) {
                log.ai.error(`Failed to process ${photo.filename}`, err.message);
                store.addFailedFile(photo.id);
                store.incrementProcessed();
            }

            // Yield to UI between photos
            await this.yieldToUI();
        }

        store.setStatus('complete');
        const stats = await dbHelpers.getStats();
        log.ai.success(`Processing complete`, {
            total: stats.total,
            matched: stats.matched,
            hasFace: stats.hasFace,
        });
    }

    /**
     * Process a single photo — detects ALL faces and finds best match
     * This handles group photos where the user may not be the most prominent face.
     */
    private async processPhoto(
        photo: PhotoMetadata,
        referenceEmbedding: number[]
    ): Promise<void> {
        log.ai.info(`Scanning: ${photo.filename}`);

        // Read file from OPFS
        const blob = await opfsManager.readFile(photo.id);

        // Detect ALL faces in the image (not just one)
        const faces = await faceScanner.detectAllFaces(blob);

        const updates: Partial<PhotoMetadata> = {
            hasFace: faces.length > 0,
            processed: true,
        };

        if (faces.length > 0) {
            log.ai.info(`Found ${faces.length} face(s) in ${photo.filename}`);

            // Compare each detected face with the reference and take the best match
            let bestMatch: { isMatch: boolean; distance: number; confidence: number } | null = null;

            for (const face of faces) {
                if (!face.embedding) continue;

                const comparison = faceScanner.compareFaces(
                    referenceEmbedding,
                    face.embedding
                );

                // Keep the closest match (lowest distance)
                if (!bestMatch || comparison.distance < bestMatch.distance) {
                    bestMatch = comparison;
                }
            }

            if (bestMatch) {
                updates.isMatch = bestMatch.isMatch;
                updates.faceConfidence = bestMatch.confidence;

                if (bestMatch.isMatch) {
                    useProcessingStore.getState().incrementMatched();
                    log.ai.success(`Match found: ${photo.filename} (${(bestMatch.confidence * 100).toFixed(0)}%, dist: ${bestMatch.distance.toFixed(3)})`);
                }
            }
        }

        // Update DB
        await dbHelpers.updatePhoto(photo.id, updates);
    }

    /**
     * Cancel processing
     */
    cancel(): void {
        this.cancelled = true;
        log.ai.warn('Processing cancellation requested');
    }

    /**
     * Yield to the UI thread so animations stay smooth
     */
    private yieldToUI(): Promise<void> {
        return new Promise((resolve) => {
            if ('requestIdleCallback' in window) {
                requestIdleCallback(() => resolve(), { timeout: 100 });
            } else {
                setTimeout(resolve, 16);
            }
        });
    }
}

export const processingPipeline = new ProcessingPipeline();
