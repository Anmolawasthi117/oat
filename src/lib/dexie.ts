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
     */
    async getMatchedPhotos(): Promise<PhotoMetadata[]> {
        return await db.photos.where('isMatch').equals(true).toArray();
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
     */
    async getStats() {
        const total = await db.photos.count();
        const processed = await db.photos.where('processed').equals(true).count();
        const matched = await db.photos.where('isMatch').equals(true).count();
        const hasFace = await db.photos.where('hasFace').equals(true).count();

        return { total, processed, matched, hasFace };
    },
};
