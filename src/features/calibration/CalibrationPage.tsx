import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';
import { CameraCapture } from './CameraCapture';
import { faceScanner } from '../../services/ai/face-detector';
import { useAuthStore } from '../../store/auth';
import { dbHelpers } from '../../lib/dexie';
import { cleanupSession } from '../../utils/cleanup';
import { springs } from '../../config/theme';
import { log } from '../../lib/logger';
import type { SavedFace } from '../../types';

/**
 * Calibration Page — "First, who are we looking for?"
 * 
 * Shows saved faces (if any) for instant re-use, or upload/camera for new.
 * On success, saves face + thumbnail to IndexedDB for next time.
 */

type Step = 'intro' | 'camera' | 'processing' | 'success' | 'error';

const COMPLIMENTS = [
  'Nice smile! 😊',
  'Looking great! ✨',
  'Perfect lighting! ☀️',
  'Love the energy! 🎉',
  'Great photo! 📸',
  'You look amazing! 💫',
];

export function CalibrationPage() {
  const [step, setStep] = useState<Step>('intro');
  const [errorMessage, setErrorMessage] = useState('');
  const [compliment] = useState(() => COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)]);
  const [savedFaces, setSavedFaces] = useState<SavedFace[]>([]);
  const [isLoadingFaces, setIsLoadingFaces] = useState(true);
  const { setReferenceFaceEmbedding, setLoading, setError } = useAuthStore();
  const navigate = useNavigate();

  // Load saved faces on mount
  useEffect(() => {
    async function loadSavedFaces() {
      try {
        const faces = await dbHelpers.getAllFaces();
        setSavedFaces(faces);
        log.ui.info('Loaded saved faces', { count: faces.length });
      } catch (err) {
        log.ui.warn('Failed to load saved faces');
      } finally {
        setIsLoadingFaces(false);
      }
    }
    loadSavedFaces();
  }, []);

  // Use a saved face directly (no re-processing needed)
  const useSavedFace = (face: SavedFace) => {
    log.ui.info('Using saved face', { label: face.label });
    setReferenceFaceEmbedding({
      embedding: face.embedding,
      capturedAt: Date.now(),
    });
    setStep('success');
    setTimeout(() => navigate('/ingestion'), 2000);
  };

  // Delete a saved face
  const handleDeleteFace = async (e: React.MouseEvent, faceId: string) => {
    e.stopPropagation();
    await dbHelpers.deleteFace(faceId);
    setSavedFaces((prev) => prev.filter((f) => f.id !== faceId));
    log.ui.info('Deleted saved face', { id: faceId });
  };

  // Generate a tiny thumbnail from a blob
  const makeThumbnail = (blob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 128;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d')!;
        // Center crop
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(blob);
    });
  };

  const processFace = async (blob: Blob) => {
    setStep('processing');
    setLoading(true);
    log.ai.info('Starting face detection on captured image...');

    try {
      log.ai.info('Initializing MediaPipe worker...');
      const initResult = await faceScanner.initialize();
      log.ai.info('Worker init result:', initResult);

      if (!initResult.success) {
        throw new Error(`ML model failed to load: ${initResult.message}`);
      }

      log.ai.info('Running face detection...');
      const result = await faceScanner.detectFace(blob);
      log.ai.info('Detection result:', { hasFace: result.hasFace, confidence: result.confidence });

      if (!result.hasFace) {
        throw new Error('No face detected. Try again with better lighting.');
      }

      if (!result.embedding) {
        throw new Error('Face found but embedding extraction failed.');
      }

      log.ai.success('Face embedding extracted', { dimensions: result.embedding.length });

      setReferenceFaceEmbedding({
        embedding: result.embedding,
        capturedAt: Date.now(),
      });

      // Save face to IndexedDB for next time
      try {
        const thumbnail = await makeThumbnail(blob);
        const newFace: SavedFace = {
          id: `face-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          label: savedFaces.length === 0 ? 'Me' : `Face ${savedFaces.length + 1}`,
          embedding: result.embedding,
          thumbnail,
          createdAt: Date.now(),
        };
        await dbHelpers.addFace(newFace);
        setSavedFaces((prev) => [newFace, ...prev]);
        log.storage.success('Saved face to IndexedDB', { label: newFace.label });
      } catch (saveErr) {
        log.storage.warn('Failed to save face (non-critical)');
      }

      log.storage.success('Reference embedding saved to store');
      setStep('success');

      setTimeout(() => {
        log.ui.info('Navigating to ingestion page...');
        navigate('/ingestion');
      }, 2500);
    } catch (err: any) {
      log.ai.error('Face detection failed', err.message);
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
      setError(err.message);
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    log.ui.info('Photo uploaded from device', { name: file.name, size: file.size });
    processFace(file);
  };

  return (
    <div
      className="flex-1 flex items-center justify-center p-6"
      style={{ backgroundColor: 'var(--color-oat-cream)' }}
    >
      <div className="max-w-xl w-full">
        <AnimatePresence mode="wait">

          {/* ── Intro ─────────────────────────────────── */}
          {step === 'intro' && (
            <motion.div
              key="intro"
              className="float-card p-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={springs.gentle}
            >
              <motion.div
                className="text-6xl mb-6"
                animate={{ rotate: [0, 8, -8, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
              >
                🤳
              </motion.div>

              <h1
                className="text-4xl mb-3"
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--color-espresso)',
                  fontWeight: 400,
                }}
              >
                First, who are we looking for?
              </h1>

              {/* ── Saved Faces Grid ──────────────────── */}
              {!isLoadingFaces && savedFaces.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  style={{ marginBottom: '1.5rem' }}
                >
                  <p
                    className="text-sm mb-3"
                    style={{ color: 'var(--color-warm-grey)' }}
                  >
                    Pick a saved face, or add a new one below
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      justifyContent: 'center',
                      flexWrap: 'wrap',
                    }}
                  >
                    {savedFaces.map((face, i) => (
                      <motion.button
                        key={face.id}
                        onClick={() => useSavedFace(face)}
                        whileHover={{ scale: 1.08, y: -4 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        style={{
                          position: 'relative',
                          background: 'none',
                          border: '3px solid var(--color-matcha)',
                          borderRadius: '50%',
                          padding: '3px',
                          cursor: 'pointer',
                          width: '72px',
                          height: '72px',
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={face.thumbnail}
                          alt={face.label}
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            objectFit: 'cover',
                          }}
                        />
                        {/* Delete X */}
                        <motion.div
                          onClick={(e) => handleDeleteFace(e, face.id)}
                          whileHover={{ scale: 1.2 }}
                          style={{
                            position: 'absolute',
                            top: '-4px',
                            right: '-4px',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: 'var(--color-berry)',
                            color: 'white',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                          }}
                        >
                          ×
                        </motion.div>
                        {/* Label */}
                        <span
                          style={{
                            position: 'absolute',
                            bottom: '-18px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            fontSize: '0.65rem',
                            color: 'var(--color-warm-grey)',
                            whiteSpace: 'nowrap',
                            fontFamily: 'var(--font-body)',
                          }}
                        >
                          {face.label}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── Divider if saved faces exist ─────── */}
              {savedFaces.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    margin: '1.5rem 0 1rem',
                    padding: '0 2rem',
                  }}
                >
                  <div style={{ flex: 1, height: '1px', background: 'var(--color-clay)', opacity: 0.4 }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-warm-grey)' }}>
                    or add a new face
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--color-clay)', opacity: 0.4 }} />
                </div>
              )}

              {/* ── Upload / Camera buttons ──────────── */}
              <p className="text-lg mb-4" style={{ color: 'var(--color-warm-grey)' }}>
                {savedFaces.length > 0
                  ? ''
                  : 'Take a quick selfie or upload a photo of yourself.'}
              </p>

              <div className="space-y-3 max-w-sm mx-auto">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="primary"
                    size={savedFaces.length > 0 ? 'md' : 'lg'}
                    className={`w-full ${savedFaces.length > 0 ? '' : 'text-lg py-5'}`}
                    onClick={() => {
                      log.ui.info('Camera capture selected');
                      setStep('camera');
                    }}
                  >
                    <span className="flex items-center justify-center gap-3">
                      <span className="text-xl">📷</span>
                      <span>Use Camera</span>
                    </span>
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <label className="block cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Button
                      variant="secondary"
                      size={savedFaces.length > 0 ? 'md' : 'lg'}
                      className={`w-full ${savedFaces.length > 0 ? '' : 'text-lg py-5'}`}
                      as="span"
                    >
                      <span className="flex items-center justify-center gap-3">
                        <span className="text-xl">🖼️</span>
                        <span>Upload Photo</span>
                      </span>
                    </Button>
                  </label>
                </motion.div>
              </div>

              {/* Back to home */}
              <motion.button
                onClick={async () => {
                  await cleanupSession();
                  navigate('/');
                }}
                whileHover={{ x: -3 }}
                style={{
                  marginTop: '1.5rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  color: 'var(--color-warm-grey)',
                  fontFamily: 'var(--font-body)',
                }}
              >
                ← Back to Home
              </motion.button>

              <motion.p
                className="mt-4 text-sm"
                style={{ color: 'var(--color-warm-grey)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                💡 Good lighting helps AI find you more accurately.
                <br />
                Your photo stays on your device — always.
              </motion.p>
            </motion.div>
          )}

          {/* ── Camera ────────────────────────────────── */}
          {step === 'camera' && (
            <motion.div
              key="camera"
              className="float-card p-6"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={springs.gentle}
            >
              <h2
                className="text-2xl text-center mb-4"
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--color-espresso)',
                  fontWeight: 400,
                }}
              >
                Say cheese! 📸
              </h2>
              <CameraCapture
                onCapture={(blob) => {
                  log.ui.info('Camera photo captured');
                  processFace(blob);
                }}
                onCancel={() => setStep('intro')}
              />
            </motion.div>
          )}

          {/* ── Processing ────────────────────────────── */}
          {step === 'processing' && (
            <motion.div
              key="processing"
              className="float-card p-10 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={springs.gentle}
            >
              <motion.div
                className="text-5xl mb-4"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                🔍
              </motion.div>
              <h2
                className="text-2xl mb-2"
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--color-espresso)',
                  fontWeight: 400,
                }}
              >
                Learning your features...
              </h2>
              <p className="text-sm" style={{ color: 'var(--color-warm-grey)' }}>
                Learning your facial features
              </p>
            </motion.div>
          )}

          {/* ── Success ───────────────────────────────── */}
          {step === 'success' && (
            <motion.div
              key="success"
              className="float-card p-10 text-center"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={springs.bouncy}
            >
              <motion.div
                className="text-7xl mb-4"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={springs.bouncy}
              >
                ✨
              </motion.div>

              <h2
                className="text-3xl mb-2"
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--color-espresso)',
                  fontWeight: 400,
                }}
              >
                {compliment}
              </h2>
              <p className="text-lg mb-6" style={{ color: 'var(--color-warm-grey)' }}>
                Got it! Now let's find your photos.
              </p>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="primary"
                  size="lg"
                  className="text-lg"
                  onClick={() => navigate('/ingestion')}
                >
                  <span className="flex items-center gap-2">
                    <span>Drop your photos</span>
                    <span>→</span>
                  </span>
                </Button>
              </motion.div>
            </motion.div>
          )}

          {/* ── Error ─────────────────────────────────── */}
          {step === 'error' && (
            <motion.div
              key="error"
              className="float-card p-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springs.gentle}
            >
              <div className="text-5xl mb-4">😅</div>

              <h2
                className="text-2xl mb-2"
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--color-berry)',
                  fontWeight: 400,
                }}
              >
                Hmm, that didn't work
              </h2>

              <p className="mb-6" style={{ color: 'var(--color-warm-grey)' }}>
                {errorMessage}
              </p>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => {
                    setErrorMessage('');
                    setStep('intro');
                  }}
                >
                  Try Again
                </Button>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
