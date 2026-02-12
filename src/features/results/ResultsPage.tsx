import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';
import { springs } from '../../config/theme';
import { db, dbHelpers } from '../../lib/dexie';
import { opfsManager } from '../../services/opfs/opfs-manager';
import { exportAsZip } from '../../services/export/export-service';
import { log } from '../../lib/logger';
import type { PhotoMetadata } from '../../types';

/**
 * Results Page — Gallery of processed photos
 * 
 * Shows matched photos highlighted, with select & export.
 */

export function ResultsPage() {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<PhotoMetadata[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showMatchesOnly, setShowMatchesOnly] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load photos from IndexedDB
  useEffect(() => {
    async function loadPhotos() {
      log.ui.info('Results page mounted, loading photos...');
      const allPhotos = await db.photos.toArray();
      setPhotos(allPhotos);

      // Load thumbnails for visible photos
      await opfsManager.initialize();
      const thumbs: Record<string, string> = {};
      for (const photo of allPhotos.slice(0, 100)) {
        try {
          const blob = await opfsManager.readFile(photo.id);
          thumbs[photo.id] = URL.createObjectURL(blob);
        } catch {
          // Skip if file not found
        }
      }
      setThumbnails(thumbs);
      setIsLoading(false);
      log.ui.success(`Loaded ${allPhotos.length} photos`);
    }
    loadPhotos();

    return () => {
      // Cleanup blob URLs
      Object.values(thumbnails).forEach(URL.revokeObjectURL);
    };
  }, []); // eslint-disable-line

  const filteredPhotos = useMemo(() => {
    return showMatchesOnly ? photos.filter((p) => p.isMatch) : photos;
  }, [photos, showMatchesOnly]);

  const matchedPhotos = useMemo(() => photos.filter((p) => p.isMatch), [photos]);
  const stats = useMemo(() => ({
    total: photos.length,
    matched: matchedPhotos.length,
    hasFace: photos.filter((p) => p.hasFace).length,
  }), [photos, matchedPhotos]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectAllMatches = () => {
    setSelectedIds(new Set(matchedPhotos.map((p) => p.id)));
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleExport = async () => {
    if (selectedIds.size === 0) return;
    setIsExporting(true);
    try {
      await exportAsZip(Array.from(selectedIds));
    } catch (err: any) {
      log.storage.error('Export failed', err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleStartOver = async () => {
    await dbHelpers.clearAllPhotos();
    await opfsManager.clearAll();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-oat-cream)' }}
      >
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-4xl mb-4 animate-breathe">📷</div>
          <p style={{ color: 'var(--color-warm-grey)' }}>Loading your photos...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-6"
      style={{ backgroundColor: 'var(--color-oat-cream)' }}
    >
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.gentle}
        >
          <h1
            className="text-4xl mb-2"
            style={{
              fontFamily: 'var(--font-heading)',
              color: 'var(--color-espresso)',
              fontWeight: 400,
            }}
          >
            Your Results ✨
          </h1>
          <p style={{ color: 'var(--color-warm-grey)' }}>
            Found <strong style={{ color: '#6B9E6B' }}>{stats.matched}</strong>{' '}
            match{stats.matched === 1 ? '' : 'es'} in {stats.total} photo{stats.total === 1 ? '' : 's'}
          </p>
        </motion.div>

        {/* Controls bar */}
        <motion.div
          className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 float-card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          {/* Toggle */}
          <div className="flex items-center gap-3">
            <button
              className="text-sm px-3 py-1.5 cursor-pointer transition-all"
              style={{
                borderRadius: 'var(--radius-pill, 999px)',
                backgroundColor: !showMatchesOnly ? 'var(--color-espresso)' : 'transparent',
                color: !showMatchesOnly ? 'var(--color-oat-cream)' : 'var(--color-warm-grey)',
                border: !showMatchesOnly ? 'none' : '1px solid var(--color-clay)',
              }}
              onClick={() => setShowMatchesOnly(false)}
            >
              All ({stats.total})
            </button>
            <button
              className="text-sm px-3 py-1.5 cursor-pointer transition-all"
              style={{
                borderRadius: 'var(--radius-pill, 999px)',
                backgroundColor: showMatchesOnly ? '#6B9E6B' : 'transparent',
                color: showMatchesOnly ? 'white' : 'var(--color-warm-grey)',
                border: showMatchesOnly ? 'none' : '1px solid var(--color-clay)',
              }}
              onClick={() => setShowMatchesOnly(true)}
            >
              Matches ({stats.matched})
            </button>
          </div>

          {/* Selection controls */}
          <div className="flex items-center gap-3">
            {selectedIds.size > 0 ? (
              <>
                <span className="text-sm" style={{ color: 'var(--color-warm-grey)' }}>
                  {selectedIds.size} selected
                </span>
                <button
                  className="text-sm underline cursor-pointer"
                  style={{ color: 'var(--color-berry)' }}
                  onClick={clearSelection}
                >
                  Clear
                </button>
              </>
            ) : (
              <button
                className="text-sm underline cursor-pointer"
                style={{ color: 'var(--color-espresso)' }}
                onClick={selectAllMatches}
              >
                Select all matches
              </button>
            )}
          </div>
        </motion.div>

        {/* Photo Grid */}
        <motion.div
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          {filteredPhotos.map((photo, i) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              thumbnail={thumbnails[photo.id]}
              isSelected={selectedIds.has(photo.id)}
              onToggle={() => toggleSelect(photo.id)}
              index={i}
            />
          ))}
        </motion.div>

        {filteredPhotos.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🤷</p>
            <p style={{ color: 'var(--color-warm-grey)' }}>
              {showMatchesOnly ? 'No matches found. Try scanning more photos!' : 'No photos to show.'}
            </p>
          </div>
        )}

        {/* Bottom actions */}
        <motion.div
          className="flex flex-wrap items-center justify-center gap-4 py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {selectedIds.size > 0 && (
            <Button
              variant="primary"
              size="lg"
              className="text-lg px-10"
              onClick={handleExport}
              disabled={isExporting}
            >
              {isExporting ? 'Exporting...' : `Download ${selectedIds.size} Photo${selectedIds.size === 1 ? '' : 's'} 📦`}
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={() => navigate('/ingestion')}>
            Add More Photos
          </Button>

          <Button variant="ghost" size="sm" onClick={handleStartOver}>
            Start Over
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

function PhotoCard({
  photo,
  thumbnail,
  isSelected,
  onToggle,
  index,
}: {
  photo: PhotoMetadata;
  thumbnail?: string;
  isSelected: boolean;
  onToggle: () => void;
  index: number;
}) {
  return (
    <motion.div
      className="relative aspect-square cursor-pointer group overflow-hidden"
      style={{
        borderRadius: 'var(--radius-soft)',
        border: isSelected
          ? '3px solid #6B9E6B'
          : photo.isMatch
            ? '3px solid var(--color-matcha)'
            : '3px solid transparent',
        boxShadow: photo.isMatch ? '0 4px 14px rgba(195, 217, 195, 0.4)' : undefined,
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(index * 0.02, 0.5) }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onToggle}
    >
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={photo.filename}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-paper)' }}
        >
          📷
        </div>
      )}

      {/* Match badge */}
      {photo.isMatch && (
        <div
          className="absolute top-1.5 left-1.5 w-6 h-6 flex items-center justify-center text-xs"
          style={{
            borderRadius: '50%',
            backgroundColor: '#6B9E6B',
            color: 'white',
          }}
        >
          ✓
        </div>
      )}

      {/* Selection indicator */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(107, 158, 107, 0.3)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="w-8 h-8 flex items-center justify-center text-sm font-bold"
              style={{
                borderRadius: '50%',
                backgroundColor: '#6B9E6B',
                color: 'white',
              }}
            >
              ✓
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confidence label on hover */}
      {photo.faceConfidence && (
        <div
          className="absolute bottom-1 right-1 text-[10px] px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            borderRadius: '999px',
            backgroundColor: 'rgba(0,0,0,0.6)',
            color: 'white',
          }}
        >
          {(photo.faceConfidence * 100).toFixed(0)}%
        </div>
      )}
    </motion.div>
  );
}
