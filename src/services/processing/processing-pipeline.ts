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

        // Get reference embedding
        const referenceEmbedding = authStore.referenceFaceEmbedding;
        if (!referenceEmbedding) {
            store.setError('No reference face set. Please calibrate first.');
            log.ai.error('No reference embedding found');
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
        const photos = await db.photos.where('processed').equals(0).toArray();
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
     * Process a single photo
     */
    private async processPhoto(
        photo: PhotoMetadata,
        referenceEmbedding: number[]
    ): Promise<void> {
        log.ai.info(`Scanning: ${photo.filename}`);

        // Read file from OPFS
        const blob = await opfsManager.readFile(photo.id);

        // Detect face
        const result = await faceScanner.detectFace(blob);

        const updates: Partial<PhotoMetadata> = {
            hasFace: result.hasFace,
            processed: true,
        };

        if (result.hasFace && result.embedding) {
            // Compare with reference face
            const comparison = faceScanner.compareFaces(
                referenceEmbedding,
                result.embedding
            );

            updates.isMatch = comparison.isMatch;
            updates.faceConfidence = comparison.confidence;

            if (comparison.isMatch) {
                useProcessingStore.getState().incrementMatched();
                log.ai.success(`Match found: ${photo.filename} (${(comparison.confidence * 100).toFixed(0)}%)`);
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
