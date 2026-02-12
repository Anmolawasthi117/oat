import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui';
import { log } from '../../lib/logger';

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void;
  onCancel: () => void;
}

/**
 * Camera Capture — Mirror selfie with face guide and countdown
 */

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      log.ui.info('Requesting camera access...');

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      setStream(mediaStream);
      log.ui.success('Camera stream active');
    } catch (err: any) {
      log.ui.error('Camera access denied', err.message);
      setError('Camera access denied. Please allow camera permissions and try again.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      log.ui.info('Camera stream stopped');
    }
  };

  const startCountdown = () => {
    log.ui.info('Starting 3-second countdown...');
    setCountdown(3);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    setTimeout(() => capturePhoto(), 3000);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          log.ui.success('Image captured', { size: blob.size });
          stopCamera();
          onCapture(blob);
        }
      },
      'image/jpeg',
      0.9
    );
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-base mb-4" style={{ color: 'var(--color-berry)' }}>
          {error}
        </p>
        <Button onClick={onCancel} variant="secondary">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Video preview */}
      <div className="relative overflow-hidden" style={{ borderRadius: 'var(--radius-pebble)' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full"
          style={{
            transform: 'scaleX(-1)',
            maxHeight: 420,
            objectFit: 'cover',
          }}
        />

        {/* Face guide oval */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div
            style={{
              width: 200,
              height: 260,
              border: '3px dashed var(--color-matcha)',
              borderRadius: '50%',
              opacity: 0.5,
            }}
          />
        </motion.div>

        {/* Countdown overlay */}
        {countdown !== null && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.span
              className="text-8xl font-bold"
              style={{ color: 'var(--color-matcha)' }}
              key={countdown}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
            >
              {countdown}
            </motion.span>
          </motion.div>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Controls */}
      <div className="flex gap-3 justify-center mt-5">
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
          <Button
            variant="primary"
            size="lg"
            onClick={startCountdown}
            disabled={countdown !== null}
          >
            📸 Capture
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
          <Button variant="outline" size="lg" onClick={onCancel}>
            Cancel
          </Button>
        </motion.div>
      </div>

      <p className="text-center text-sm mt-4" style={{ color: 'var(--color-warm-grey)' }}>
        Center your face in the oval, then click Capture
      </p>
    </div>
  );
}
