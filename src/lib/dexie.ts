import Dexie, { type EntityTable } from 'dexie';
import { DB_NAME, DB_VERSION } from '../config/constants';
import type { PhotoMetadata } from '../types';

/**
 * IndexedDB Database using Dexie
 * Stores metadata about photos (NOT the actual photo blobs - those go in OPFS)
 */
class OATDatabase extends Dexie {
    photos!: EntityTable<PhotoMetadata, 'id'>;

    constructor() {
        super(DB_NAME);

        this.version(DB_VERSION).stores({
            photos: 'id, timestamp, source, hasFace, isMatch, processed, driveId',
        });
    }
}

// Export singleton instance
export const db = new OATDatabase();

// Helper functions
export const dbHelpers = {
    /**
     * Add a new photo to the database
     */
    async addPhoto(photo: PhotoMetadata): Promise<void> {
        await db.photos.add(photo);
    },

    /**
     * Get all photos from a specific source
     */
    async getPhotosBySource(source: 'local' | 'drive'): Promise<PhotoMetadata[]> {
        return await db.photos.where('source').equals(source).toArray();
    },

    /**
     * Get all matched photos
     * NOTE: IndexedDB can't reliably index booleans, so we filter in JS
     */
    async getMatchedPhotos(): Promise<PhotoMetadata[]> {
        const all = await db.photos.toArray();
        return all.filter(p => p.isMatch === true);
    },

    /**
     * Update photo after processing
     */
    async updatePhoto(id: string, updates: Partial<PhotoMetadata>): Promise<void> {
        await db.photos.update(id, updates);
    },

    /**
     * Delete a photo by ID
     */
    async deletePhoto(id: string): Promise<void> {
        await db.photos.delete(id);
    },

    /**
     * Clear all photos
     */
    async clearAllPhotos(): Promise<void> {
        await db.photos.clear();
    },

    /**
     * Get processing statistics
     * NOTE: IndexedDB can't reliably index booleans, so we filter in JS
     */
    async getStats() {
        const all = await db.photos.toArray();
        const total = all.length;
        const processed = all.filter(p => p.processed === true).length;
        const matched = all.filter(p => p.isMatch === true).length;
        const hasFace = all.filter(p => p.hasFace === true).length;

        return { total, processed, matched, hasFace };
    },
};
