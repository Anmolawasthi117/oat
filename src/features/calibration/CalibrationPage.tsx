import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui';
import { CameraCapture } from './CameraCapture';
import { faceScanner } from '../../services/ai/face-detector';
import { useAuthStore } from '../../store/auth';
import { springs } from '../../config/theme';

/**
 * Calibration Page - Reference Selfie Capture
 * User takes/uploads a selfie for face recognition
 */

type CalibrationStep = 'intro' | 'camera' | 'upload' | 'processing' | 'success' | 'error';

export function CalibrationPage() {
  const [step, setStep] = useState<CalibrationStep>('intro');
  const [errorMessage, setErrorMessage] = useState('');
  const { setReferenceFaceEmbedding, setLoading, setError } = useAuthStore();
  const navigate = useNavigate();

  const handleCameraCapture = async (blob: Blob) => {
    setStep('processing');
    setLoading(true);

    try {
      // Initialize worker if needed
      await faceScanner.initialize();

      // Detect face and extract embedding
      const result = await faceScanner.detectFace(blob);

      if (!result.hasFace) {
        throw new Error('No face detected. Please try again with better lighting.');
      }

      // Store embedding in state
      setReferenceFaceEmbedding({
        embedding: result.embedding,
        capturedAt: Date.now(),
      });

      setStep('success');
      
      // Navigate to ingestion after 2 seconds
      setTimeout(() => {
        navigate('/ingestion');
      }, 2000);
    } catch (err: any) {
      console.error('❌ Face detection failed:', err);
      setErrorMessage(err.message || 'Failed to process selfie. Please try again.');
      setError(err.message);
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    handleCameraCapture(file);
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-8"
      style={{ backgroundColor: 'var(--color-oat-cream)' }}
    >
      <div className="max-w-3xl w-full">
        <AnimatePresence mode="wait">
          {/* Intro Step */}
          {step === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={springs.gentle}
            >
              <Card className="text-center">
                <CardHeader>
                  <motion.div
                    className="text-8xl mb-6"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    📸
                  </motion.div>
                  <CardTitle className="text-4xl">
                    Let's Calibrate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl mb-8 max-w-xl mx-auto" style={{ color: 'var(--color-warm-grey)' }}>
                    Take a quick selfie so we know who to look for in your photo collection.
                  </p>

                  <div className="space-y-4">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        variant="primary"
                        size="lg"
                        className="w-full max-w-md text-xl py-6"
                        onClick={() => setStep('camera')}
                      >
                        <span className="flex items-center justify-center gap-3">
                          <span className="text-3xl">📷</span>
                          <span>Use Camera</span>
                        </span>
                      </Button>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <label className="block">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                        <Button
                          variant="secondary"
                          size="lg"
                          className="w-full max-w-md text-xl py-6"
                          as="span"
                        >
                          <span className="flex items-center justify-center gap-3">
                            <span className="text-3xl">🖼️</span>
                            <span>Upload Photo</span>
                          </span>
                        </Button>
                      </label>
                    </motion.div>
                  </div>

                  <motion.div
                    className="mt-8 p-4 rounded-lg max-w-md mx-auto"
                    style={{ backgroundColor: 'var(--color-oat-cream)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <p className="text-sm" style={{ color: 'var(--color-warm-grey)' }}>
                      💡 <strong>Tips:</strong> Make sure your face is well-lit and clearly visible. This helps our AI find you in your photos!
                    </p>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Camera Step */}
          {step === 'camera' && (
            <motion.div
              key="camera"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={springs.gentle}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-3xl text-center">
                    Say Cheese! 😊
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CameraCapture
                    onCapture={handleCameraCapture}
                    onCancel={() => setStep('intro')}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Processing Step */}
          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={springs.gentle}
            >
              <Card className="text-center">
                <CardContent>
                  <motion.div
                    className="text-9xl mb-6"
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 360] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🔮
                  </motion.div>
                  <h2 
                    className="text-3xl font-bold mb-4"
                    style={{
                      fontFamily: 'var(--font-heading)',
                      color: 'var(--color-espresso)',
                    }}
                  >
                    Analyzing Face...
                  </h2>
                  <p className="text-lg" style={{ color: 'var(--color-warm-grey)' }}>
                    Our AI is learning your facial features
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={springs.bouncy}
            >
              <Card className="text-center">
                <CardContent>
                  <motion.div
                    className="text-9xl mb-6"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={springs.bouncy}
                  >
                    ✨
                  </motion.div>
                  <h2 
                    className="text-4xl font-bold mb-4"
                    style={{
                      fontFamily: 'var(--font-heading)',
                      color: 'var(--color-espresso)',
                    }}
                  >
                    Perfect!
                  </h2>
                  <p className="text-xl" style={{ color: 'var(--color-warm-grey)' }}>
                    We've got your reference. Let's find your photos!
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Error Step */}
          {step === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={springs.gentle}
            >
              <Card className="text-center">
                <CardContent>
                  <div className="text-7xl mb-6">😔</div>
                  <h2 
                    className="text-3xl font-bold mb-4"
                    style={{
                      fontFamily: 'var(--font-heading)',
                      color: 'var(--color-berry)',
                    }}
                  >
                    Oops!
                  </h2>
                  <p className="text-lg mb-6" style={{ color: 'var(--color-warm-grey)' }}>
                    {errorMessage}
                  </p>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => setStep('intro')}
                    >
                      Try Again
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

