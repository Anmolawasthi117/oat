import { STORAGE } from '../../config/constants';

/**
 * OPFS (Origin Private File System) Manager
 * 
 * CRITICAL: This solves the "no-blob-in-state" problem.
 * Instead of storing large Blobs in React state (which crashes on mobile),
 * we write files to the browser's private file system (like a hard drive).
 * 
 * Files are only loaded into memory when needed for display.
 */

class OPFSManager {
    private root: FileSystemDirectoryHandle | null = null;
    private thumbnailsDir: FileSystemDirectoryHandle | null = null;
    private originalsDir: FileSystemDirectoryHandle | null = null;

    /**
     * Initialize OPFS and create directory structure
     */
    async initialize(): Promise<void> {
        try {
            // Get root directory handle
            this.root = await navigator.storage.getDirectory();

            // Create subdirectories
            this.thumbnailsDir = await this.root.getDirectoryHandle(STORAGE.OPFS_THUMBNAILS, { create: true });
            this.originalsDir = await this.root.getDirectoryHandle(STORAGE.OPFS_ORIGINALS, { create: true });

            console.log('✅ OPFS initialized successfully');
        } catch (error) {
            console.error('❌ OPFS initialization failed:', error);
            throw new Error('OPFS is not supported in this browser');
        }
    }

    /**
     * Write a file to OPFS
     * @param fileId - Unique identifier for the file
     * @param blob - The file data
     * @param type - 'thumbnail' or 'original'
     */
    async writeFile(fileId: string, blob: Blob, type: 'thumbnail' | 'original' = 'original'): Promise<string> {
        if (!this.root) await this.initialize();

        const dir = type === 'thumbnail' ? this.thumbnailsDir : this.originalsDir;
        if (!dir) throw new Error('OPFS not initialized');

        try {
            const fileHandle = await dir.getFileHandle(fileId, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();

            const path = `${type}/${fileId}`;
            console.log(`✅ Written file: ${path}`);
            return path;
        } catch (error) {
            console.error(`❌ Failed to write file ${fileId}:`, error);
            throw error;
        }
    }

    /**
     * Read a file from OPFS
     * @param fileId - Unique identifier for the file
     * @param type - 'thumbnail' or 'original'
     */
    async readFile(fileId: string, type: 'thumbnail' | 'original' = 'original'): Promise<Blob> {
        if (!this.root) await this.initialize();

        const dir = type === 'thumbnail' ? this.thumbnailsDir : this.originalsDir;
        if (!dir) throw new Error('OPFS not initialized');

        try {
            const fileHandle = await dir.getFileHandle(fileId);
            const file = await fileHandle.getFile();
            return file;
        } catch (error) {
            console.error(`❌ Failed to read file ${fileId}:`, error);
            throw error;
        }
    }

    /**
     * Delete a file from OPFS
     */
    async deleteFile(fileId: string, type: 'thumbnail' | 'original' = 'original'): Promise<void> {
        if (!this.root) await this.initialize();

        const dir = type === 'thumbnail' ? this.thumbnailsDir : this.originalsDir;
        if (!dir) throw new Error('OPFS not initialized');

        try {
            await dir.removeEntry(fileId);
            console.log(`✅ Deleted file: ${type}/${fileId}`);
        } catch (error) {
            console.error(`❌ Failed to delete file ${fileId}:`, error);
        }
    }

    /**
     * List all files in a directory
     */
    async listFiles(type: 'thumbnail' | 'original' = 'original'): Promise<string[]> {
        if (!this.root) await this.initialize();

        const dir = type === 'thumbnail' ? this.thumbnailsDir : this.originalsDir;
        if (!dir) throw new Error('OPFS not initialized');

        const files: string[] = [];
        // @ts-expect-error - TypeScript doesn't have full OPFS types yet
        for await (const entry of dir.values()) {
            if (entry.kind === 'file') {
                files.push(entry.name);
            }
        }
        return files;
    }

    /**
     * Clear all files (useful for testing)
     */
    async clearAll(): Promise<void> {
        if (!this.root) await this.initialize();

        // Clear thumbnails
        if (this.thumbnailsDir) {
            // @ts-expect-error - TypeScript doesn't have full OPFS types yet
            for await (const entry of this.thumbnailsDir.values()) {
                await this.thumbnailsDir.removeEntry(entry.name);
            }
        }

        // Clear originals
        if (this.originalsDir) {
            // @ts-expect-error - TypeScript doesn't have full OPFS types yet
            for await (const entry of this.originalsDir.values()) {
                await this.originalsDir.removeEntry(entry.name);
            }
        }

        console.log('✅ OPFS cleared');
    }

    /**
     * Check if OPFS is supported
     */
    static isSupported(): boolean {
        return 'storage' in navigator && 'getDirectory' in navigator.storage;
    }
}

// Export singleton instance
export const opfsManager = new OPFSManager();
