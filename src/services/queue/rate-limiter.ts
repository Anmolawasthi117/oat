import PQueue from 'p-queue';
import { GOOGLE_DRIVE } from '../../config/constants';

/**
 * Rate Limiter for Google Drive API
 * 
 * Uses p-queue to ensure we don't hit API rate limits.
 * Implements "Leaky Bucket" pattern with exponential backoff on errors.
 */

class RateLimiter {
    private queue: PQueue;
    private retryDelays: Map<string, number> = new Map();

    constructor() {
        this.queue = new PQueue({
            concurrency: GOOGLE_DRIVE.MAX_CONCURRENT_REQUESTS,
            intervalCap: GOOGLE_DRIVE.MAX_CONCURRENT_REQUESTS,
            interval: 1000, // 3 requests per second
        });
    }

    /**
     * Add a task to the queue
     * @param task - Async function to execute
     * @param taskId - Optional ID for retry tracking
     */
    async add<T>(task: () => Promise<T>, taskId?: string): Promise<T> {
        return this.queue.add(async () => {
            try {
                const result = await task();

                // Reset retry delay on success
                if (taskId) {
                    this.retryDelays.delete(taskId);
                }

                return result;
            } catch (error: any) {
                // Handle 403 rate limit errors
                if (error?.status === 403 || error?.code === 403) {
                    console.warn('⚠️ Rate limit hit, applying exponential backoff');
                    return this.retryWithBackoff(task, taskId);
                }
                throw error;
            }
        });
    }

    /**
     * Retry with exponential backoff
     */
    private async retryWithBackoff<T>(task: () => Promise<T>, taskId?: string): Promise<T> {
        const currentDelay = this.retryDelays.get(taskId || 'default') || GOOGLE_DRIVE.INITIAL_RETRY_DELAY;
        const nextDelay = Math.min(
            currentDelay * GOOGLE_DRIVE.BACKOFF_MULTIPLIER,
            30000 // Max 30 seconds
        );

        if (taskId) {
            this.retryDelays.set(taskId, nextDelay);
        }

        console.log(`⏳ Retrying in ${currentDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, currentDelay));

        return this.queue.add(task);
    }

    /**
     * Get current queue statistics
     */
    getStats() {
        return {
            size: this.queue.size,
            pending: this.queue.pending,
            isPaused: this.queue.isPaused,
        };
    }

    /**
     * Clear the queue
     */
    clear() {
        this.queue.clear();
        this.retryDelays.clear();
    }

    /**
     * Pause the queue
     */
    pause() {
        this.queue.pause();
    }

    /**
     * Resume the queue
     */
    start() {
        this.queue.start();
    }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();
