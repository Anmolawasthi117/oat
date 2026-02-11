import { motion } from 'framer-motion';
import { Button } from '../../components/ui';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui';
import { APP } from '../../config/constants';
import { springs } from '../../config/theme';
import { useState } from 'react';
import { AuthModal } from '../auth/AuthModal';
import logoImg from '../../assets/logo.png';

/**
 * Landing Page - Premium UX with microinteractions
 */

export function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      <div 
        className="min-h-screen flex items-center justify-center p-8"
        style={{ backgroundColor: 'var(--color-oat-cream)' }}
      >
        <div className="max-w-4xl w-full space-y-12">
          {/* Hero Section with Stagger Animation */}
          <motion.div 
            className="text-center space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <motion.img 
              src={logoImg} 
              alt={APP.NAME} 
              className="w-40 h-40 mx-auto rounded-full shadow-xl"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={springs.bouncy}
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            />
            
            <motion.h1 
              className="text-7xl font-bold"
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-espresso)',
              }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, ...springs.gentle }}
            >
              {APP.NAME}
            </motion.h1>
            
            <motion.p 
              className="text-3xl italic"
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-warm-grey)',
              }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, ...springs.gentle }}
            >
              {APP.TAGLINE}
            </motion.p>

            <motion.p
              className="text-xl max-w-2xl mx-auto"
              style={{ color: 'var(--color-warm-grey)' }}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, ...springs.gentle }}
            >
              Find yourself in thousands of photos. Powered by AI, secured by privacy.
            </motion.p>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            className="flex gap-6 justify-center"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, ...springs.gentle }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                variant="primary" 
                size="lg"
                className="text-xl px-12 py-6"
                onClick={() => setShowAuthModal(true)}
              >
                Start Tidying →
              </Button>
            </motion.div>
          </motion.div>

          {/* Feature Cards with Stagger */}
          <motion.div 
            className="grid md:grid-cols-3 gap-8 mt-16"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.6,
                },
              },
            }}
          >
            {[
              {
                emoji: '🔒',
                title: 'Private',
                description: 'Your photos never leave your device. All processing happens locally in your browser.',
              },
              {
                emoji: '⚡',
                title: 'Fast',
                description: 'WebAssembly + Web Workers = blazing-fast AI that feels instant.',
              },
              {
                emoji: '🎨',
                title: 'Beautiful',
                description: 'A calm, tactile experience designed to feel like scrapbooking.',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { y: 30, opacity: 0 },
                  visible: { y: 0, opacity: 1 },
                }}
                whileHover={{ y: -8 }}
                transition={springs.gentle}
              >
                <Card hover>
                  <CardHeader>
                    <div className="text-5xl mb-4">{feature.emoji}</div>
                    <CardTitle className="text-2xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-base leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* How It Works */}
          <motion.div
            className="mt-20 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
          >
            <h2 
              className="text-4xl font-bold mb-12"
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-espresso)',
              }}
            >
              How It Works
            </h2>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-left">
              {[
                { step: '1', title: 'Take a selfie', desc: 'Show us who to look for' },
                { step: '2', title: 'Upload photos', desc: 'From your device or Google Drive' },
                { step: '3', title: 'AI does the magic', desc: 'Face detection finds your matches' },
                { step: '4', title: 'Download & share', desc: 'Export as ZIP or save to Drive' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="flex items-start gap-4 max-w-xs"
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 1.2 + i * 0.1, ...springs.gentle }}
                >
                  <div
                    className="text-3xl font-bold rounded-full w-14 h-14 flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: 'var(--color-matcha)',
                      color: 'var(--color-espresso)',
                    }}
                  >
                    {item.step}
                  </div>
                  <div>
                    <h3 
                      className="text-xl font-semibold mb-1"
                      style={{
                        fontFamily: 'var(--font-heading)',
                        color: 'var(--color-espresso)',
                      }}
                    >
                      {item.title}
                    </h3>
                    <p style={{ color: 'var(--color-warm-grey)' }}>
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Footer */}
          <motion.p 
            className="text-center text-sm mt-16"
            style={{ color: 'var(--color-warm-grey)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
          >
            Version {APP.VERSION} • Built with ❤️ for privacy • No data ever leaves your device
          </motion.p>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
