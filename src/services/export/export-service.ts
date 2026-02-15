/**
 * Export Service
 * 
 * Creates a ZIP file from selected photos and triggers download.
 * Uses JSZip when available, falls back to individual downloads.
 */

import { zipSync } from 'fflate';
import { opfsManager } from '../opfs/opfs-manager';
import { db } from '../../lib/dexie';
import { log } from '../../lib/logger';

/**
 * Download selected photos as a ZIP file
 */
export async function exportAsZip(fileIds: string[]): Promise<void> {
    log.storage.info(`Exporting ${fileIds.length} photos...`);

    try {
        const zipData: Record<string, Uint8Array> = {};

        for (let i = 0; i < fileIds.length; i++) {
            const id = fileIds[i];

            // Get metadata for filename
            const photo = await db.photos.get(id);
            const filename = photo?.filename || `photo_${i + 1}.jpg`;

            // Read file from OPFS
            const blob = await opfsManager.readFile(id);
            const arrayBuffer = await blob.arrayBuffer();
            zipData[filename] = new Uint8Array(arrayBuffer);

            log.storage.info(`Added to zip: ${filename} (${i + 1}/${fileIds.length})`);
        }

        // Generate ZIP
        log.storage.info('Generating ZIP file...');
        const zipped = zipSync(zipData);
        const zipBlob = new Blob([zipped as any], { type: 'application/zip' });

        // Download
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `oat-matches-${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        log.storage.success(`Exported ${fileIds.length} photos as ZIP`);
    } catch (err: any) {
        log.storage.error('Export failed', err.message);

        // Fallback: download individually
        if (fileIds.length <= 5) {
            log.storage.info('Falling back to individual downloads...');
            for (const id of fileIds) {
                const blob = await opfsManager.readFile(id);
                const photo = await db.photos.get(id);
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = photo?.filename || `photo_${id}.jpg`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } else {
            throw err;
        }
    }
}
