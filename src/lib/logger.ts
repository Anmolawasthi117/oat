

type LogCategory = 'AUTH' | 'AI' | 'STORAGE' | 'UI' | 'DRIVE' | 'WORKER';

const CATEGORY_STYLES: Record<LogCategory, { emoji: string; color: string }> = {
    AUTH: { emoji: '🔐', color: '#C3D9C3' },
    AI: { emoji: '🧠', color: '#E0C9A6' },
    STORAGE: { emoji: '💾', color: '#D48C95' },
    UI: { emoji: '🎨', color: '#8C8580' },
    DRIVE: { emoji: '☁️', color: '#7BA7D4' },
    WORKER: { emoji: '⚙️', color: '#B8A9C9' },
};

function formatTime(): string {
    return new Date().toLocaleTimeString('en-US', { hour12: false });
}

function createLog(category: LogCategory) {
    const { emoji, color } = CATEGORY_STYLES[category];

    return {
        info: (message: string, data?: unknown) => {
            console.log(
                `%c${emoji} [${formatTime()}] [${category}] ${message}`,
                `color: ${color}; font-weight: bold;`,
                data !== undefined ? data : ''
            );
        },
        success: (message: string, data?: unknown) => {
            console.log(
                `%c✅ [${formatTime()}] [${category}] ${message}`,
                `color: #4CAF50; font-weight: bold;`,
                data !== undefined ? data : ''
            );
        },
        warn: (message: string, data?: unknown) => {
            console.warn(
                `%c⚠️ [${formatTime()}] [${category}] ${message}`,
                `color: #FF9800; font-weight: bold;`,
                data !== undefined ? data : ''
            );
        },
        error: (message: string, data?: unknown) => {
            console.error(
                `%c❌ [${formatTime()}] [${category}] ${message}`,
                `color: #F44336; font-weight: bold;`,
                data !== undefined ? data : ''
            );
        },
    };
}

export const log = {
    auth: createLog('AUTH'),
    ai: createLog('AI'),
    storage: createLog('STORAGE'),
    ui: createLog('UI'),
    drive: createLog('DRIVE'),
    worker: createLog('WORKER'),
};
