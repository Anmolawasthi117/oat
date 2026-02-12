import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';
import { springs } from '../../config/theme';
import { FILE_PROCESSING } from '../../config/constants';
import { opfsManager } from '../../services/opfs/opfs-manager';
import { dbHelpers } from '../../lib/dexie';
import { log } from '../../lib/logger';
import type { PhotoMetadata } from '../../types';

/**
 * Ingestion Page — "Drop your photos here"
 * 
 * Drag-and-drop zone + file picker. Files are stored in OPFS,
 * metadata written to IndexedDB.
 */

interface SelectedFile {
  file: File;
  id: string;
  preview: string;
}

export function IngestionPage() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isStoring, setIsStoring] = useState(false);
  const [storeProgress, setStoreProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const isValidFile = (file: File) => {
    return FILE_PROCESSING.SUPPORTED_IMAGE_TYPES.includes(file.type as any) &&
      file.size <= FILE_PROCESSING.MAX_FILE_SIZE;
  };

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const validFiles = Array.from(newFiles).filter(isValidFile);
    const rejected = Array.from(newFiles).length - validFiles.length;

    if (rejected > 0) {
      log.ui.warn(`${rejected} files rejected (unsupported type or too large)`);
    }

    const mapped: SelectedFile[] = validFiles.map((file) => ({
      file,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      preview: URL.createObjectURL(file),
    }));

    log.ui.info(`Added ${mapped.length} photos`, { total: files.length + mapped.length });
    setFiles((prev) => [...prev, ...mapped]);
  }, [files.length]);

  // Drag handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) URL.revokeObjectURL(file.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  const clearAll = () => {
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
  };

  const totalSize = files.reduce((acc, f) => acc + f.file.size, 0);
  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Store files to OPFS + IndexedDB, then navigate to processing
  const startProcessing = async () => {
    if (files.length === 0) return;

    setIsStoring(true);
    log.storage.info(`Storing ${files.length} files to OPFS...`);

    try {
      await opfsManager.initialize();

      for (let i = 0; i < files.length; i++) {
        const { file, id } = files[i];

        // Write to OPFS
        const opfsPath = await opfsManager.writeFile(id, file);

        // Write metadata to IndexedDB
        const metadata: PhotoMetadata = {
          id,
          opfsPath,
          filename: file.name,
          timestamp: file.lastModified || Date.now(),
          size: file.size,
          mimeType: file.type,
          hasFace: false,
          isMatch: false,
          source: 'local',
          processed: false,
        };

        await dbHelpers.addPhoto(metadata);

        setStoreProgress(Math.round(((i + 1) / files.length) * 100));
        log.storage.info(`Stored ${i + 1}/${files.length}: ${file.name}`);
      }

      log.storage.success(`All ${files.length} files stored`);

      // Clean up previews
      files.forEach((f) => URL.revokeObjectURL(f.preview));

      navigate('/processing');
    } catch (err: any) {
      log.storage.error('Failed to store files', err.message);
    } finally {
      setIsStoring(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ backgroundColor: 'var(--color-oat-cream)' }}
    >
      <div className="max-w-2xl w-full">

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
            Drop your photos
          </h1>
          <p style={{ color: 'var(--color-warm-grey)' }}>
            We'll scan them for your face. Nothing leaves your device.
          </p>
        </motion.div>

        {/* Drop Zone */}
        <motion.div
          className="relative cursor-pointer mb-6"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15, ...springs.gentle }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <motion.div
            className="float-card flex flex-col items-center justify-center py-16 px-8 text-center"
            style={{
              border: `3px dashed ${isDragging ? 'var(--color-matcha)' : 'var(--color-clay)'}`,
              backgroundColor: isDragging ? 'rgba(214, 230, 208, 0.15)' : 'var(--color-paper)',
            }}
            animate={isDragging ? { scale: 1.02 } : files.length === 0 ? { scale: [1, 1.01, 1] } : {}}
            transition={
              files.length === 0
                ? { scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }
                : springs.gentle
            }
          >
            <motion.div
              className="text-5xl mb-4"
              animate={isDragging ? { y: -8, scale: 1.2 } : {}}
            >
              {isDragging ? '✨' : '📂'}
            </motion.div>

            <p
              className="text-lg font-medium mb-1"
              style={{ color: 'var(--color-espresso)' }}
            >
              {isDragging ? 'Drop them here!' : 'Drag photos here'}
            </p>
            <p className="text-sm" style={{ color: 'var(--color-warm-grey)' }}>
              or click to browse • JPEG, PNG, WebP, HEIC
            </p>
          </motion.div>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </motion.div>

        {/* File List */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={springs.gentle}
            >
              {/* Stats bar */}
              <div
                className="flex items-center justify-between mb-4 px-1"
                style={{ color: 'var(--color-warm-grey)' }}
              >
                <span className="text-sm font-medium">
                  {files.length} photo{files.length === 1 ? '' : 's'} • {formatSize(totalSize)}
                </span>
                <button
                  className="text-sm underline cursor-pointer"
                  style={{ color: 'var(--color-berry)' }}
                  onClick={(e) => { e.stopPropagation(); clearAll(); }}
                >
                  Clear all
                </button>
              </div>

              {/* Thumbnail grid */}
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2 mb-6">
                {files.slice(0, 24).map((f, i) => (
                  <motion.div
                    key={f.id}
                    className="relative aspect-square overflow-hidden group"
                    style={{ borderRadius: 'var(--radius-soft)' }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.02 }}
                  >
                    <img
                      src={f.preview}
                      alt={f.file.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/50 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                      onClick={(e) => { e.stopPropagation(); removeFile(f.id); }}
                    >
                      ×
                    </button>
                  </motion.div>
                ))}
                {files.length > 24 && (
                  <div
                    className="aspect-square flex items-center justify-center text-sm font-medium"
                    style={{
                      borderRadius: 'var(--radius-soft)',
                      backgroundColor: 'var(--color-clay)',
                      color: 'var(--color-espresso)',
                    }}
                  >
                    +{files.length - 24}
                  </div>
                )}
              </div>

              {/* Processing button */}
              {isStoring ? (
                <div className="text-center">
                  <div
                    className="w-full h-2 mb-3 overflow-hidden"
                    style={{
                      borderRadius: '999px',
                      backgroundColor: 'var(--color-paper)',
                    }}
                  >
                    <motion.div
                      className="h-full"
                      style={{
                        backgroundColor: 'var(--color-matcha)',
                        borderRadius: '999px',
                      }}
                      initial={{ width: '0%' }}
                      animate={{ width: `${storeProgress}%` }}
                    />
                  </div>
                  <p className="text-sm" style={{ color: 'var(--color-warm-grey)' }}>
                    Storing files... {storeProgress}%
                  </p>
                </div>
              ) : (
                <motion.div
                  className="text-center"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="primary"
                    size="lg"
                    className="text-lg px-12 py-5"
                    onClick={startProcessing}
                  >
                    Start Processing →
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Privacy note */}
        <motion.p
          className="text-center text-xs mt-8"
          style={{ color: 'var(--color-warm-grey)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          🔐 All processing happens in your browser. Nothing is uploaded anywhere.
        </motion.p>
      </div>
    </div>
  );
}
