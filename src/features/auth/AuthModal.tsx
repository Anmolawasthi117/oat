import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../../components/ui';
import { useAuth } from './useAuth';
import { springs } from '../../config/theme';
import { log } from '../../lib/logger';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Auth Modal — Warm, inviting, two clear paths
 */

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { signInWithGoogle, continueAsGuest, isLoading, authError } = useAuth();

  const handleGuestMode = () => {
    log.auth.info('Guest mode selected');
    continueAsGuest();
    onClose();
  };

  const handleGoogleSignIn = async () => {
    log.auth.info('Google sign-in selected');
    await signInWithGoogle();
    // Only close if no error occurred
    if (!authError) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(45, 45, 45, 0.3)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              className="float-card p-8 max-w-md w-full"
              initial={{ scale: 0.92, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 30 }}
              transition={springs.gentle}
            >
              {/* Header */}
              <div className="text-center mb-8">
                <motion.div
                  className="text-5xl mb-4"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                >
                  👋
                </motion.div>
                <h2
                  className="text-3xl mb-2"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    color: 'var(--color-espresso)',
                    fontWeight: 400,
                  }}
                >
                  Let's get started
                </h2>
                <p className="text-base" style={{ color: 'var(--color-warm-grey)' }}>
                  Choose how you'd like to tidy your photos
                </p>
              </div>

              {/* Buttons */}
              <div className="space-y-4 mb-6">
                {/* Guest Mode — Primary */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full text-lg py-5"
                    onClick={handleGuestMode}
                    disabled={isLoading}
                  >
                    <span className="flex items-center justify-center gap-3">
                      <span className="text-xl">🚀</span>
                      <span>Start Instantly</span>
                    </span>
                  </Button>
                </motion.div>

                {/* Divider */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-clay)' }} />
                  <span className="text-sm" style={{ color: 'var(--color-warm-grey)' }}>or</span>
                  <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-clay)' }} />
                </div>

                {/* Google Drive */}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full text-lg py-5"
                    onClick={handleGoogleSignIn}
                    isLoading={isLoading}
                    disabled={isLoading}
                  >
                    <span className="flex items-center justify-center gap-3">
                      <span className="text-xl">☁️</span>
                      <span>Connect Google Drive</span>
                    </span>
                  </Button>
                </motion.div>
              </div>

              {/* Error message */}
              {authError && (
                <motion.div
                  className="p-4 mb-4 text-sm"
                  style={{
                    backgroundColor: 'rgba(212, 140, 149, 0.15)',
                    borderRadius: 'var(--radius-soft)',
                    color: 'var(--color-berry)',
                  }}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  ⚠️ {authError}
                </motion.div>
              )}

              {/* Info rows */}
              <div className="space-y-2 mb-4">
                <InfoPill icon="🔒" text="Guest = local files only, instant access" />
                <InfoPill icon="☁️" text="Google Drive = import photos from your cloud" />
              </div>

              {/* Privacy note */}
              <p className="text-center text-xs" style={{ color: 'var(--color-warm-grey)' }}>
                🔐 Everything runs in your browser. Nothing is uploaded.
              </p>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function InfoPill({ icon, text }: { icon: string; text: string }) {
  return (
    <motion.div
      className="flex items-center gap-2 px-4 py-2.5 text-sm"
      style={{
        backgroundColor: 'var(--color-oat-cream)',
        borderRadius: 'var(--radius-soft)',
        color: 'var(--color-warm-grey)',
      }}
      whileHover={{ x: 3 }}
      transition={springs.snappy}
    >
      <span>{icon}</span>
      <span>{text}</span>
    </motion.div>
  );
}
