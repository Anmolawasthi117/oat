import { log } from '../../lib/logger';
import { GOOGLE_DRIVE } from '../../config/constants';
import { useAuthStore } from '../../store/auth';

/**
 * Google Drive Service
 *
 * Uses the OAuth access token obtained during Firebase sign-in (which includes
 * Drive scopes). NO separate GIS popup — single sign-in, zero friction.
 *
 * - pickFolder() → Google Picker to select a folder
 * - listImages(folderId) → list image files in the folder
 * - downloadImage(fileId) → download as Blob
 * - createFolder(name) → create a results folder
 * - uploadFile(folderId, blob, name) → upload a photo
 */

const DRIVE_API = 'https://www.googleapis.com/drive/v3';

// ─── Token Access ───────────────────────────────────────

/**
 * Get the Firebase OAuth access token from the auth store.
 * Throws if not authenticated or token missing.
 */
function getAccessToken(): string {
    const token = useAuthStore.getState().googleAccessToken;
    if (!token) {
        throw new Error('Not authenticated with Google Drive. Please sign in first.');
    }
    return token;
}

// ─── Script Loaders ─────────────────────────────────────

function loadScript(src: string, id: string): Promise<void> {
    return new Promise((resolve, reject) => {
        if (document.getElementById(id)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.id = id;
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
    });
}

// ─── Drive REST Helpers ─────────────────────────────────

async function driveRequest<T>(
    path: string,
    options: RequestInit = {},
    retries = GOOGLE_DRIVE.RETRY_ATTEMPTS,
): Promise<T> {
    const token = getAccessToken();
    let delay = GOOGLE_DRIVE.INITIAL_RETRY_DELAY;

    for (let attempt = 0; attempt <= retries; attempt++) {
        const res = await fetch(`${DRIVE_API}${path}`, {
            ...options,
            headers: {
                Authorization: `Bearer ${token}`,
                ...options.headers,
            },
        });

        if (res.ok) return await res.json();

        // Retry on 429 / 5xx
        if ((res.status === 429 || res.status >= 500) && attempt < retries) {
            log.storage.warn(`Drive API ${res.status}, retrying in ${delay}ms...`);
            await new Promise((r) => setTimeout(r, delay));
            delay *= GOOGLE_DRIVE.BACKOFF_MULTIPLIER;
            continue;
        }

        const error = await res.text();
        throw new Error(`Drive API error ${res.status}: ${error}`);
    }

    throw new Error('Max retries exceeded');
}

// ─── Public API ─────────────────────────────────────────

export const gdriveService = {
    /**
     * Check if we have a Drive access token (from Firebase sign-in)
     */
    isAuthenticated(): boolean {
        return !!useAuthStore.getState().googleAccessToken;
    },

    /**
     * Pick a folder using the Google Picker API
     */
    async pickFolder(): Promise<{ id: string; name: string } | null> {
        const token = getAccessToken();

        await loadScript('https://apis.google.com/js/api.js', 'gapi-script');
        await new Promise<void>((resolve) => (window as any).gapi.load('picker', resolve));

        return new Promise((resolve) => {
            const picker = new (window as any).google.picker.PickerBuilder()
                .addView(
                    new (window as any).google.picker.DocsView()
                        .setIncludeFolders(true)
                        .setSelectFolderEnabled(true)
                        .setMimeTypes('application/vnd.google-apps.folder')
                )
                .setOAuthToken(token)
                .setCallback((data: any) => {
                    if (data.action === 'picked') {
                        const folder = data.docs[0];
                        resolve({ id: folder.id, name: folder.name });
                    } else if (data.action === 'cancel') {
                        resolve(null);
                    }
                })
                .setTitle('Select a folder with photos')
                .build();
            picker.setVisible(true);
        });
    },

    /**
     * List image files in a folder
     */
    async listImages(
        folderId: string,
        onProgress?: (loaded: number, total: number) => void,
    ): Promise<Array<{ id: string; name: string; mimeType: string; size: number }>> {
        const images: Array<{ id: string; name: string; mimeType: string; size: number }> = [];
        let pageToken: string | undefined;

        do {
            const params = new URLSearchParams({
                q: `'${folderId}' in parents and mimeType contains 'image/' and trashed = false`,
                fields: 'nextPageToken, files(id, name, mimeType, size)',
                pageSize: '100',
            });
            if (pageToken) params.set('pageToken', pageToken);

            const res = await driveRequest<any>(`/files?${params}`);
            const files = (res.files || []).map((f: any) => ({
                id: f.id,
                name: f.name,
                mimeType: f.mimeType,
                size: parseInt(f.size || '0', 10),
            }));
            images.push(...files);
            pageToken = res.nextPageToken;

            onProgress?.(images.length, images.length + (pageToken ? 100 : 0));
        } while (pageToken);

        log.storage.info(`Listed ${images.length} images from GDrive folder`);
        return images;
    },

    /**
     * Download an image as a Blob
     */
    async downloadImage(fileId: string): Promise<Blob> {
        const token = getAccessToken();
        const res = await fetch(`${DRIVE_API}/files/${fileId}?alt=media`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Download failed: ${res.status}`);
        return await res.blob();
    },

    /**
     * Create a folder in Google Drive
     */
    async createFolder(name: string, parentId?: string): Promise<string> {
        const metadata: any = {
            name,
            mimeType: 'application/vnd.google-apps.folder',
        };
        if (parentId) metadata.parents = [parentId];

        const res = await driveRequest<any>('/files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(metadata),
        });
        log.storage.success(`Created GDrive folder: ${name} (${res.id})`);
        return res.id;
    },

    /**
     * Upload a file to a Google Drive folder
     */
    async uploadFile(folderId: string, blob: Blob, name: string): Promise<string> {
        const token = getAccessToken();

        const metadata = {
            name,
            parents: [folderId],
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', blob);

        const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: form,
        });

        if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
        const data = await res.json();
        return data.id;
    },
};
