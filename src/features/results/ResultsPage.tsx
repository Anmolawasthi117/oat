import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';
import { Lightbox } from '../../components/ui/Lightbox';
import { springs } from '../../config/theme';
import { db, dbHelpers } from '../../lib/dexie';
import { opfsManager } from '../../services/opfs/opfs-manager';
import { gdriveService } from '../../services/gdrive/gdrive-service';
import { useAuthStore } from '../../store/auth';
import { cleanupSession } from '../../utils/cleanup';
import { exportAsZip } from '../../services/export/export-service';
import { log } from '../../lib/logger';
import type { PhotoMetadata } from '../../types';

/**
 * Results Page — Gallery of processed photos
 * 
 * Features: confidence slider, lightbox, select & export.
 */

export function ResultsPage() {
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<PhotoMetadata[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showMatchesOnly, setShowMatchesOnly] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [threshold, setThreshold] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showStatsToast, setShowStatsToast] = useState(false);
  const [driveUploading, setDriveUploading] = useState<string | null>(null);
  const authMode = useAuthStore((s) => s.authMode);

  // Load photos from IndexedDB
  useEffect(() => {
    async function loadPhotos() {
      log.ui.info('Results page mounted, loading photos...');
      const allPhotos = await db.photos.toArray();
      setPhotos(allPhotos);

      // Load thumbnails progressively — matches first, then batches
      await opfsManager.initialize();

      // Prioritize match photos, then load remaining
      const matchPhotos = allPhotos.filter((p) => p.isMatch);
      const otherPhotos = allPhotos.filter((p) => !p.isMatch);
      const ordered = [...matchPhotos, ...otherPhotos];

      const INITIAL_BATCH = 48; // ~one screen of grid
      const thumbs: Record<string, string> = {};

      // Load initial batch synchronously
      for (const photo of ordered.slice(0, INITIAL_BATCH)) {
        try {
          const blob = await opfsManager.readFile(photo.id);
          thumbs[photo.id] = URL.createObjectURL(blob);
        } catch {
          // Skip if file not found
        }
      }
      setThumbnails({ ...thumbs });
      setIsLoading(false);
      log.ui.success(`Loaded ${allPhotos.length} photos, ${matchPhotos.length} matches`);

      // Show stats toast
      if (matchPhotos.length > 0) {
        setShowStatsToast(true);
        setTimeout(() => setShowStatsToast(false), 4500);
      }

      // Load remaining thumbnails in background batches of 24
      const remaining = ordered.slice(INITIAL_BATCH);
      const BATCH_SIZE = 24;
      for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
        const batch = remaining.slice(i, i + BATCH_SIZE);
        for (const photo of batch) {
          try {
            const blob = await opfsManager.readFile(photo.id);
            thumbs[photo.id] = URL.createObjectURL(blob);
          } catch {
            // skip
          }
        }
        setThumbnails({ ...thumbs });
        // Small delay between batches to let browser breathe
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    loadPhotos();

    return () => {
      // Cleanup blob URLs
      Object.values(thumbnails).forEach(URL.revokeObjectURL);
    };
  }, []); // eslint-disable-line

  // Apply confidence threshold to filter matches
  const filteredPhotos = useMemo(() => {
    let filtered = photos;

    if (showMatchesOnly) {
      filtered = filtered.filter(
        (p) => p.isMatch && (threshold === 0 || (p.faceConfidence ?? 0) >= threshold)
      );
    }

    return filtered;
  }, [photos, showMatchesOnly, threshold]);

  // Total matches (from pipeline, no threshold applied)
  const allMatchedPhotos = useMemo(
    () => photos.filter((p) => p.isMatch),
    [photos]
  );

  // Matches visible with current slider threshold
  const visibleMatchedPhotos = useMemo(
    () => photos.filter((p) => p.isMatch && (threshold === 0 || (p.faceConfidence ?? 0) >= threshold)),
    [photos, threshold]
  );

  const stats = useMemo(() => ({
    total: photos.length,
    matched: allMatchedPhotos.length,
    visibleMatched: visibleMatchedPhotos.length,
    hasFace: photos.filter((p) => p.hasFace).length,
  }), [photos, allMatchedPhotos, visibleMatchedPhotos]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectAllMatches = () => {
    setSelectedIds(new Set(visibleMatchedPhotos.map((p) => p.id)));
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
    await cleanupSession();
    navigate('/');
  };

  const handleSaveToDrive = async () => {
    if (selectedIds.size === 0) return;
    try {
      setDriveUploading('Creating folder...');
      const folderName = `OAT Results ${new Date().toLocaleDateString()}`;
      const folderId = await gdriveService.createFolder(folderName);
      
      const ids = Array.from(selectedIds);
      for (let i = 0; i < ids.length; i++) {
        const photo = photos.find((p) => p.id === ids[i]);
        if (!photo) continue;
        setDriveUploading(`Uploading ${i + 1}/${ids.length}...`);
        const blob = await opfsManager.readFile(photo.id);
        await gdriveService.uploadFile(folderId, blob, photo.filename);
      }
      setDriveUploading(null);
      log.storage.success(`Uploaded ${ids.length} photos to GDrive`);
    } catch (err: any) {
      log.storage.error('Save to Drive failed', err.message);
      setDriveUploading(null);
    }
  };

  if (isLoading) {
    return (
      <div
        className="flex-1 flex items-center justify-center"
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
      className="flex-1 p-6"
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

        {/* Stats Toast */}
        <AnimatePresence>
          {showStatsToast && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={springs.bouncy}
              style={{
                position: 'fixed',
                top: '5rem',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 60,
                background: 'var(--color-paper)',
                borderRadius: 'var(--radius-pebble)',
                padding: '0.75rem 1.5rem',
                boxShadow: 'var(--shadow-hover)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                fontFamily: 'var(--font-body)',
                fontSize: '0.9rem',
                color: 'var(--color-espresso)',
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>📸</span>
              <span>
                Found you in <strong style={{ color: '#6B9E6B' }}>{stats.matched}</strong> of {stats.total} photos!
              </span>
              <span style={{ fontSize: '1.3rem' }}>🎉</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls bar */}
        <motion.div
          className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 float-card"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          {/* Toggle + Slider */}
          <div className="flex flex-col gap-3 flex-1 min-w-0">
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
              Matches ({stats.matched}{threshold > 0 && stats.visibleMatched !== stats.matched ? ` → ${stats.visibleMatched}` : ''})
            </button>
            </div>

            {/* Confidence Slider */}
            <div className="flex items-center gap-3">
              <label
                className="text-xs whitespace-nowrap"
                style={{ color: 'var(--color-warm-grey)' }}
              >
                Match Sensitivity
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                style={{
                  flex: 1,
                  maxWidth: '200px',
                  accentColor: '#6B9E6B',
                  cursor: 'pointer',
                }}
              />
              <span
                className="text-xs font-mono"
                style={{
                  color: 'var(--color-espresso)',
                  minWidth: '3ch',
                  textAlign: 'right',
                }}
              >
                {(threshold * 100).toFixed(0)}%
              </span>
            </div>
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
              onView={() => setLightboxIndex(i)}
              index={i}
            />
          ))}
        </motion.div>

        {filteredPhotos.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">🤷</p>
            <p style={{ color: 'var(--color-warm-grey)' }}>
              {showMatchesOnly ? 'No matches at this sensitivity. Try lowering the slider!' : 'No photos to show.'}
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

          <Button variant="secondary" size="sm" onClick={() => navigate('/ingestion')}>
            ← Scan More Photos
          </Button>

          {authMode === 'authenticated' && selectedIds.size > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSaveToDrive}
              disabled={!!driveUploading}
            >
              {driveUploading || '☁️ Save to Drive'}
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={handleStartOver}>
            Start Over
          </Button>
        </motion.div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          photos={filteredPhotos}
          thumbnails={thumbnails}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}

function PhotoCard({
  photo,
  thumbnail,
  isSelected,
  onToggle,
  onView,
  index,
}: {
  photo: PhotoMetadata;
  thumbnail?: string;
  isSelected: boolean;
  onToggle: () => void;
  onView: () => void;
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
      onDoubleClick={(e) => { e.stopPropagation(); onView(); }}
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

      {/* View button on hover */}
      <div
        className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
        style={{
          borderRadius: '50%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          color: 'white',
        }}
        onClick={(e) => { e.stopPropagation(); onView(); }}
      >
        🔍
      </div>

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
