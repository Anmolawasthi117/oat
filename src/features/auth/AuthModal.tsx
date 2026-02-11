import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui';
import { useAuth } from './useAuth';
import { springs } from '../../config/theme';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Authentication Modal - Premium UX with smooth animations
 */

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signInWithGoogle, continueAsGuest, isLoading } = useAuth();

  const handleGuestMode = () => {
    continueAsGuest();
    onClose();
  };

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={springs.gentle}
            >
              <Card className="max-w-md w-full">
                <CardHeader>
                  <CardTitle className="text-3xl text-center">
                    Let's Get Started
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p 
                    className="text-center mb-8 text-lg"
                    style={{ color: 'var(--color-warm-grey)' }}
                  >
                    Choose how you'd like to begin tidying your photos
                  </p>

                  <div className="space-y-4">
                    {/* Guest Mode */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="primary"
                        size="lg"
                        className="w-full text-lg py-6"
                        onClick={handleGuestMode}
                        disabled={isLoading}
                      >
                        <span className="flex items-center justify-center gap-3">
                          <span className="text-2xl">🚀</span>
                          <span>Start Instantly (Guest Mode)</span>
                        </span>
                      </Button>
                    </motion.div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div 
                          className="w-full border-t"
                          style={{ borderColor: 'var(--color-warm-grey)' }}
                        />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span 
                          className="px-4"
                          style={{ 
                            backgroundColor: 'var(--color-paper)',
                            color: 'var(--color-warm-grey)',
                          }}
                        >
                          or
                        </span>
                      </div>
                    </div>

                    {/* Google Drive Mode */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        variant="secondary"
                        size="lg"
                        className="w-full text-lg py-6"
                        onClick={handleGoogleSignIn}
                        isLoading={isLoading}
                        disabled={isLoading}
                      >
                        <span className="flex items-center justify-center gap-3">
                          <span className="text-2xl">📸</span>
                          <span>Connect Google Drive</span>
                        </span>
                      </Button>
                    </motion.div>
                  </div>

                  {/* Info Cards */}
                  <div className="mt-8 space-y-3">
                    <InfoRow 
                      icon="🔒" 
                      title="Guest Mode"
                      text="Local files only, instant access"
                    />
                    <InfoRow 
                      icon="☁️" 
                      title="Google Drive"
                      text="Access photos from your Drive library"
                    />
                  </div>

                  {/* Privacy Note */}
                  <motion.p
                    className="mt-6 text-center text-sm"
                    style={{ color: 'var(--color-warm-grey)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    🔐 All processing happens in your browser. Your photos never leave your device.
                  </motion.p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function InfoRow({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <motion.div
      className="flex items-center gap-3 p-3 rounded-lg"
      style={{ backgroundColor: 'var(--color-oat-cream)' }}
      whileHover={{ x: 4 }}
      transition={springs.snappy}
    >
      <span className="text-2xl">{icon}</span>
      <div>
        <div 
          className="font-semibold text-sm"
          style={{ 
            fontFamily: 'var(--font-heading)',
            color: 'var(--color-espresso)',
          }}
        >
          {title}
        </div>
        <div 
          className="text-xs"
          style={{ color: 'var(--color-warm-grey)' }}
        >
          {text}
        </div>
      </div>
    </motion.div>
  );
}
