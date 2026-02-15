import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import type { PhotoMetadata } from '../../types';

/**
 * Lightbox — Full-screen photo viewer with confidence badge.
 * Arrow keys to navigate, Esc or click backdrop to close.
 */

interface LightboxProps {
    photos: PhotoMetadata[];
    thumbnails: Record<string, string>;
    initialIndex: number;
    onClose: () => void;
}

export function Lightbox({ photos, thumbnails, initialIndex, onClose }: LightboxProps) {
    const [index, setIndex] = useState(initialIndex);
    const photo = photos[index];

    const goNext = useCallback(() => setIndex((i) => Math.min(i + 1, photos.length - 1)), [photos.length]);
    const goPrev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') goNext();
            if (e.key === 'ArrowLeft') goPrev();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose, goNext, goPrev]);

    if (!photo) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 100,
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'zoom-out',
                }}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1.5rem',
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        fontSize: '2rem',
                        cursor: 'pointer',
                        zIndex: 101,
                        opacity: 0.7,
                    }}
                >
                    ✕
                </button>

                {/* Left arrow */}
                {index > 0 && (
                    <motion.button
                        whileHover={{ scale: 1.2 }}
                        onClick={(e) => { e.stopPropagation(); goPrev(); }}
                        style={{
                            position: 'absolute',
                            left: '1rem',
                            background: 'rgba(255,255,255,0.15)',
                            border: 'none',
                            color: 'white',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        ←
                    </motion.button>
                )}

                {/* Right arrow */}
                {index < photos.length - 1 && (
                    <motion.button
                        whileHover={{ scale: 1.2 }}
                        onClick={(e) => { e.stopPropagation(); goNext(); }}
                        style={{
                            position: 'absolute',
                            right: '1rem',
                            background: 'rgba(255,255,255,0.15)',
                            border: 'none',
                            color: 'white',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        →
                    </motion.button>
                )}

                {/* Image */}
                <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        position: 'relative',
                        maxWidth: '85vw',
                        maxHeight: '85vh',
                        cursor: 'default',
                    }}
                >
                    {thumbnails[photo.id] ? (
                        <img
                            src={thumbnails[photo.id]}
                            alt={photo.filename}
                            style={{
                                maxWidth: '85vw',
                                maxHeight: '85vh',
                                objectFit: 'contain',
                                borderRadius: '8px',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                width: '300px',
                                height: '300px',
                                background: 'var(--color-paper)',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '3rem',
                            }}
                        >
                            📷
                        </div>
                    )}

                    {/* Info bar at bottom */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '-3rem',
                            left: 0,
                            right: 0,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '1rem',
                        }}
                    >
                        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                            {photo.filename}
                        </span>
                        {photo.isMatch && (
                            <span
                                style={{
                                    background: '#6B9E6B',
                                    color: 'white',
                                    padding: '0.2rem 0.7rem',
                                    borderRadius: '999px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                }}
                            >
                                Match {photo.faceConfidence ? `${(photo.faceConfidence * 100).toFixed(0)}%` : ''}
                            </span>
                        )}
                        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                            {index + 1} / {photos.length}
                        </span>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
