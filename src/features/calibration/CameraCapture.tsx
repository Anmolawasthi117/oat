import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui';
import { springs } from '../../config/theme';

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void;
  onCancel: () => void;
}

/**
 * Camera Capture Component
 * Uses getUserMedia to access camera and capture selfie
 */

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (err: any) {
      console.error('❌ Camera access failed:', err);
      setError('Unable to access camera. Please grant camera permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const captureWithCountdown = () => {
    setCountdown(3);
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    setTimeout(() => {
      capturePhoto();
    }, 3000);
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

    canvas.toBlob((blob) => {
      if (blob) {
        stopCamera();
        onCapture(blob);
      }
    }, 'image/jpeg', 0.9);
  };

  if (error) {
    return (
      <motion.div
        className="text-center p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <p className="text-xl mb-4" style={{ color: 'var(--color-berry)' }}>
          {error}
        </p>
        <Button onClick={onCancel} variant="secondary">
          Go Back
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="relative">
      {/* Video Preview */}
      <div className="relative overflow-hidden" style={{ borderRadius: '1.75rem' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full"
          style={{ 
            transform: 'scaleX(-1)', // Mirror effect
            maxHeight: '500px',
            objectFit: 'cover',
          }}
        />

        {/* Face Overlay Frame */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div
            className="border-4 rounded-full"
            style={{
              width: '280px',
              height: '350px',
              borderColor: 'var(--color-matcha)',
              borderStyle: 'dashed',
              opacity: 0.6,
            }}
          />
        </motion.div>

        {/* Countdown Overlay */}
        {countdown !== null && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
          >
            <motion.div
              className="text-9xl font-bold"
              style={{ color: 'var(--color-matcha)' }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              {countdown}
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Controls */}
      <motion.div
        className="flex gap-4 justify-center mt-6"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            variant="primary"
            size="lg"
            onClick={captureWithCountdown}
            disabled={countdown !== null}
          >
            <span className="flex items-center gap-2">
              <span className="text-2xl">📸</span>
              <span>Capture Selfie</span>
            </span>
          </Button>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button variant="outline" size="lg" onClick={onCancel}>
            Cancel
          </Button>
        </motion.div>
      </motion.div>

      {/* Instructions */}
      <motion.div
        className="mt-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-lg" style={{ color: 'var(--color-warm-grey)' }}>
          Position your face in the oval and click "Capture Selfie"
        </p>
        <p className="text-sm mt-2" style={{ color: 'var(--color-warm-grey)' }}>
          We'll use this to find you in your photos. Your photo stays on your device.
        </p>
      </motion.div>
    </div>
  );
}
