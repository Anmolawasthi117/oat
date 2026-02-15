import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { LandingPage } from './features/auth/LandingPage';
import { CalibrationPage } from './features/calibration/CalibrationPage';
import { IngestionPage } from './features/ingestion/IngestionPage';
import { ProcessingPage } from './features/processing/ProcessingPage';
import { ResultsPage } from './features/results/ResultsPage';

/**
 * Main App Component with Routing
 * All pages wrapped in Layout (Header + Footer except Landing)
 */

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/calibration" element={<CalibrationPage />} />
          <Route path="/ingestion" element={<IngestionPage />} />
          <Route path="/processing" element={<ProcessingPage />} />
          <Route path="/results" element={<ResultsPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
