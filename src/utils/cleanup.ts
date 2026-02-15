/**
 * Session Cleanup Utility
 *
 * Centralises the "start over" logic so every navigation point
 * (Header logo, CalibrationPage back, ResultsPage Start Over) behaves identically:
 *   1. Clear all photos from IndexedDB
 *   2. Clear all blobs from OPFS
 *   3. Reset the processing store
 *
 * NOTE: Does NOT clear saved faces — those persist across sessions by design.
 */

import { dbHelpers } from '../lib/dexie';
import { opfsManager } from '../services/opfs/opfs-manager';
import { useProcessingStore } from '../store/processing';
import { log } from '../lib/logger';

export async function cleanupSession(): Promise<void> {
    log.storage.info('Cleaning up session — clearing photos + OPFS');

    await Promise.all([
        dbHelpers.clearAllPhotos(),
        opfsManager.clearAll(),
    ]);

    // Reset processing state so the next scan starts fresh
    useProcessingStore.getState().reset();

    log.storage.success('Session cleaned up');
}
