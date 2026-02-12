import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Button } from '../../components/ui';
import { APP } from '../../config/constants';
import { springs } from '../../config/theme';
import { useState, useEffect } from 'react';
import { AuthModal } from '../auth/AuthModal';
import { log } from '../../lib/logger';

/**
 * Landing Page — "The Welcome Mat"
 * 
 * Comfy Scrapbook aesthetic: fanned polaroids, breathing dropzone,
 * editorial serif typography, personality-driven microcopy.
 */

// Randomized taglines for personality
const TAGLINES = [
  'Too many photos? Let\'s find the good ones.',
  'Thousands of photos. One you.',
  'Find yourself in the chaos.',
  'Your photos, tidied with care.',
];

const POLAROID_PHOTOS = [
  { rotation: -12, x: -80, y: 20, color: '#D6E6D0', emoji: '🌿' },
  { rotation: -5, x: -30, y: -10, color: '#E0C9A6', emoji: '☕' },
  { rotation: 3, x: 20, y: 15, color: '#E8C4C8', emoji: '🌸' },
  { rotation: 10, x: 70, y: -5, color: '#B8C4E0', emoji: '🦋' },
  { rotation: -8, x: -50, y: 40, color: '#D6E6D0', emoji: '📸' },
];

export function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [tagline] = useState(() => TAGLINES[Math.floor(Math.random() * TAGLINES.length)]);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    log.ui.info('Landing page mounted');
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left - rect.width / 2) / 40);
    mouseY.set((e.clientY - rect.top - rect.height / 2) / 40);
  };

  return (
    <>
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ backgroundColor: 'var(--color-oat-cream)' }}
        onMouseMove={handleMouseMove}
      >
        <div className="max-w-2xl w-full text-center">

          {/* ── Polaroid Pile ─────────────────────────── */}
          <motion.div
            className="relative mx-auto mb-12"
            style={{ width: 280, height: 240 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            {POLAROID_PHOTOS.map((photo, i) => (
              <PolaroidCard key={i} photo={photo} index={i} mouseX={mouseX} mouseY={mouseY} />
            ))}
          </motion.div>

          {/* ── Heading ───────────────────────────────── */}
          <motion.h1
            className="text-6xl md:text-7xl mb-4"
            style={{
              fontFamily: 'var(--font-heading)',
              color: 'var(--color-espresso)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
            }}
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, ...springs.gentle }}
          >
            {APP.NAME}
          </motion.h1>

          {/* ── Tagline ───────────────────────────────── */}
          <motion.p
            className="text-xl md:text-2xl mb-2"
            style={{
              fontFamily: 'var(--font-heading)',
              color: 'var(--color-warm-grey)',
              fontStyle: 'italic',
            }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.45, ...springs.gentle }}
          >
            {tagline}
          </motion.p>

          <motion.p
            className="text-base mb-10 max-w-md mx-auto"
            style={{ color: 'var(--color-warm-grey)' }}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.55, ...springs.gentle }}
          >
            AI-powered face recognition that runs entirely in your browser. 
            Your photos never leave your device.
          </motion.p>

          {/* ── CTA Button (Breathing) ────────────────── */}
          <motion.div
            className="mb-16"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.65, ...springs.gentle }}
          >
            <motion.div
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.97 }}
              animate={{ scale: [1, 1.02, 1] }}
              transition={{
                scale: {
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }}
            >
              <Button
                variant="primary"
                size="lg"
                className="text-xl px-14 py-6"
                onClick={() => {
                  log.ui.info('CTA clicked — opening auth modal');
                  setShowAuthModal(true);
                }}
              >
                Start Tidying →
              </Button>
            </motion.div>
          </motion.div>

          {/* ── How It Works ──────────────────────────── */}
          <motion.div
            className="mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
          >
            <h2
              className="text-3xl mb-8"
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-espresso)',
                fontWeight: 400,
              }}
            >
              How it works
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              {[
                { num: '1', label: 'Take a selfie', icon: '🤳' },
                { num: '2', label: 'Drop your photos', icon: '📂' },
                { num: '3', label: 'AI sorts them', icon: '✨' },
                { num: '4', label: 'Download yours', icon: '📥' },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.0 + i * 0.1, ...springs.gentle }}
                >
                  <div className="text-3xl mb-2">{step.icon}</div>
                  <div
                    className="text-sm font-medium mb-1"
                    style={{ color: 'var(--color-espresso)' }}
                  >
                    Step {step.num}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--color-warm-grey)' }}>
                    {step.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* ── Feature Pills ─────────────────────────── */}
          <motion.div
            className="flex flex-wrap gap-3 justify-center mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
          >
            {[
              { label: 'Privacy-first', bg: 'var(--color-matcha)' },
              { label: 'No upload needed', bg: 'var(--color-clay)' },
              { label: 'Works offline', bg: 'var(--color-periwinkle)' },
            ].map((pill, i) => (
              <motion.span
                key={i}
                className="px-4 py-1.5 text-sm font-medium"
                style={{
                  backgroundColor: pill.bg,
                  color: 'var(--color-espresso)',
                  borderRadius: '999px',
                }}
                whileHover={{ scale: 1.05 }}
              >
                {pill.label}
              </motion.span>
            ))}
          </motion.div>

          {/* ── Footer ────────────────────────────────── */}
          <motion.p
            className="text-xs"
            style={{ color: 'var(--color-warm-grey)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
          >
            v{APP.VERSION} · No data ever leaves your device
          </motion.p>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}

/* ── Polaroid Card Component ─────────────────────────── */

function PolaroidCard({
  photo,
  index,
  mouseX,
  mouseY,
}: {
  photo: typeof POLAROID_PHOTOS[0];
  index: number;
  mouseX: any;
  mouseY: any;
}) {
  // Subtle parallax: each polaroid moves slightly with the mouse
  const x = useTransform(mouseX, (v: number) => photo.x + v * (index + 1) * 0.3);
  const y = useTransform(mouseY, (v: number) => photo.y + v * (index + 1) * 0.3);

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 polaroid"
      style={{
        x,
        y,
        width: 100,
        height: 120,
        marginLeft: -50,
        marginTop: -60,
        zIndex: index,
      }}
      initial={{ rotate: 0, opacity: 0, scale: 0.5 }}
      animate={{ rotate: photo.rotation, opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 + index * 0.08, ...springs.bouncy }}
      whileHover={{ scale: 1.1, rotate: 0, zIndex: 10 }}
    >
      <div
        className="w-full flex items-center justify-center"
        style={{
          height: 80,
          backgroundColor: photo.color,
          borderRadius: 2,
          fontSize: 32,
        }}
      >
        {photo.emoji}
      </div>
    </motion.div>
  );
}
