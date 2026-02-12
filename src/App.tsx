import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from './features/auth/LandingPage';
import { CalibrationPage } from './features/calibration/CalibrationPage';
import { IngestionPage } from './features/ingestion/IngestionPage';
import { ProcessingPage } from './features/processing/ProcessingPage';
import { ResultsPage } from './features/results/ResultsPage';

/**
 * Main App Component with Routing
 */

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/calibration" element={<CalibrationPage />} />
        <Route path="/ingestion" element={<IngestionPage />} />
        <Route path="/processing" element={<ProcessingPage />} />
        <Route path="/results" element={<ResultsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
