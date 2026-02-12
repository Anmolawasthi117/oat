import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';
import { CameraCapture } from './CameraCapture';
import { faceScanner } from '../../services/ai/face-detector';
import { useAuthStore } from '../../store/auth';
import { springs } from '../../config/theme';
import { log } from '../../lib/logger';

/**
 * Calibration Page — "First, who are we looking for?"
 * 
 * Comfy vibe: sparkle animations, randomized compliments, warm microcopy.
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
  const { setReferenceFaceEmbedding, setLoading, setError } = useAuthStore();
  const navigate = useNavigate();

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
      className="min-h-screen flex items-center justify-center p-6"
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

              <p className="text-lg mb-8" style={{ color: 'var(--color-warm-grey)' }}>
                Take a quick selfie or upload a photo of yourself.
              </p>

              <div className="space-y-3 max-w-sm mx-auto">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full text-lg py-5"
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
                      size="lg"
                      className="w-full text-lg py-5"
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

              <motion.p
                className="mt-8 text-sm"
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
                Say cheese! 😊
              </h2>
              <CameraCapture
                onCapture={processFace}
                onCancel={() => setStep('intro')}
              />
            </motion.div>
          )}

          {/* ── Processing ────────────────────────────── */}
          {step === 'processing' && (
            <motion.div
              key="processing"
              className="float-card p-10 text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={springs.gentle}
            >
              {/* Sparkle ring */}
              <div className="relative w-32 h-32 mx-auto mb-6">
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ border: '3px dashed var(--color-matcha)' }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                />
                <div className="absolute inset-3 rounded-full flex items-center justify-center text-5xl"
                  style={{ backgroundColor: 'var(--color-paper)' }}
                >
                  🧠
                </div>
              </div>

              <h2
                className="text-3xl mb-2"
                style={{
                  fontFamily: 'var(--font-heading)',
                  color: 'var(--color-espresso)',
                  fontWeight: 400,
                }}
              >
                Analyzing...
              </h2>
              <p style={{ color: 'var(--color-warm-grey)' }}>
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
              <p className="text-lg" style={{ color: 'var(--color-warm-grey)' }}>
                Got it! Now let's find your photos.
              </p>
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
