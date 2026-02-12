import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';
import { springs } from '../../config/theme';
import { useProcessingStore, selectProgress } from '../../store/processing';
import { processingPipeline } from '../../services/processing/processing-pipeline';
import { log } from '../../lib/logger';

/**
 * Processing Page — Live progress while scanning photos
 */

const encouragement = [
  "Scanning the pile... 📸",
  "Looking for familiar faces...",
  "Almost there, hang tight ☕",
  "Your AI is doing its thing...",
  "Sorting through the memories...",
  "Looking... looking... 🔍",
];

export function ProcessingPage() {
  const navigate = useNavigate();
  const hasStarted = useRef(false);

  const status = useProcessingStore((s) => s.status);
  const totalFiles = useProcessingStore((s) => s.totalFiles);
  const processedFiles = useProcessingStore((s) => s.processedFiles);
  const matchedFiles = useProcessingStore((s) => s.matchedFiles);
  const error = useProcessingStore((s) => s.error);
  const progress = useProcessingStore(selectProgress);

  // Start processing on mount
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    log.ui.info('Processing page mounted, starting pipeline...');
    processingPipeline.processAll();
  }, []);

  // Navigate to results when done
  useEffect(() => {
    if (status === 'complete') {
      log.ui.info('Processing complete, navigating to results...');
      const timer = setTimeout(() => navigate('/results'), 1500);
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  const handleCancel = () => {
    processingPipeline.cancel();
    navigate('/ingestion');
  };

  // Rotating encouragement message
  const messageIndex = Math.floor(processedFiles / Math.max(1, Math.ceil(totalFiles / encouragement.length))) % encouragement.length;

  // SVG progress ring
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ backgroundColor: 'var(--color-oat-cream)' }}
    >
      <div className="max-w-md w-full text-center">

        {/* Progress Ring */}
        <motion.div
          className="relative inline-block mb-8"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springs.gentle}
        >
          <svg width="200" height="200" viewBox="0 0 200 200">
            {/* Background circle */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke="var(--color-paper)"
              strokeWidth="10"
            />
            {/* Progress circle */}
            <motion.circle
              cx="100"
              cy="100"
              r={radius}
              fill="none"
              stroke={status === 'complete' ? 'var(--color-matcha)' : 'var(--color-clay)'}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              transform="rotate(-90 100 100)"
            />
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className="text-3xl font-bold"
              style={{ color: 'var(--color-espresso)' }}
              key={progress}
            >
              {progress}%
            </motion.span>
            <span className="text-xs" style={{ color: 'var(--color-warm-grey)' }}>
              {processedFiles} / {totalFiles}
            </span>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-3xl mb-2"
          style={{
            fontFamily: 'var(--font-heading)',
            color: 'var(--color-espresso)',
            fontWeight: 400,
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, ...springs.gentle }}
        >
          {status === 'complete' ? 'All done! ✨' : 'Scanning your photos...'}
        </motion.h1>

        {/* Encouragement */}
        <motion.p
          className="mb-6"
          style={{ color: 'var(--color-warm-grey)' }}
          key={messageIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {status === 'complete'
            ? `Found ${matchedFiles} match${matchedFiles === 1 ? '' : 'es'} 🎉`
            : encouragement[messageIndex]}
        </motion.p>

        {/* Stats */}
        {status === 'processing' && (
          <motion.div
            className="flex justify-center gap-6 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <StatPill label="Scanned" value={processedFiles} />
            <StatPill label="Matches" value={matchedFiles} accent />
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <motion.div
            className="mb-6 p-4 text-sm"
            style={{
              backgroundColor: 'rgba(212, 140, 149, 0.15)',
              color: 'var(--color-berry)',
              borderRadius: 'var(--radius-soft)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.div>
        )}

        {/* Actions */}
        {status === 'processing' && (
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
        )}

        {status === 'complete' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              variant="primary"
              size="lg"
              className="text-lg px-10"
              onClick={() => navigate('/results')}
            >
              See Results →
            </Button>
          </motion.div>
        )}

        {/* Privacy footer */}
        <motion.p
          className="text-xs mt-10"
          style={{ color: 'var(--color-warm-grey)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          🔐 Everything runs locally in your browser
        </motion.p>
      </div>
    </div>
  );
}

function StatPill({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      className="px-4 py-2 text-center"
      style={{
        borderRadius: 'var(--radius-pill, 999px)',
        backgroundColor: accent ? 'rgba(195, 217, 195, 0.3)' : 'var(--color-paper)',
      }}
    >
      <div
        className="text-xl font-bold"
        style={{ color: accent ? '#6B9E6B' : 'var(--color-espresso)' }}
      >
        {value}
      </div>
      <div className="text-xs" style={{ color: 'var(--color-warm-grey)' }}>
        {label}
      </div>
    </div>
  );
}
