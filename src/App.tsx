import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'sonner';
import { Layout } from './components/layout/Layout';
import { AuthProvider } from './features/auth/AuthProvider';
import { LandingPage } from './features/auth/LandingPage';
import { CalibrationPage } from './features/calibration/CalibrationPage';
import { IngestionPage } from './features/ingestion/IngestionPage';
import { ProcessingPage } from './features/processing/ProcessingPage';
import { ResultsPage } from './features/results/ResultsPage';

/**
 * InnerApp — Handles routing and animations.
 * Must be child of BrowserRouter to use useLocation.
 */
function InnerApp() {
  const location = useLocation();

  return (
    <AuthProvider>
      <Layout>
        {/* AnimatePresence enables exit animations for routes */}
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/calibration" element={<CalibrationPage />} />
            <Route path="/ingestion" element={<IngestionPage />} />
            <Route path="/processing" element={<ProcessingPage />} />
            <Route path="/results" element={<ResultsPage />} />
          </Routes>
        </AnimatePresence>
      </Layout>
    </AuthProvider>
  );
}

/**
 * Main App Component — Providers only.
 */
function App() {
  return (
    <BrowserRouter>
      <InnerApp />
      <Toaster position="top-center" expand={false} richColors closeButton />
    </BrowserRouter>
  );
}

export default App;
