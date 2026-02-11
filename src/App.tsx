import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from './features/auth/LandingPage';
import { CalibrationPage } from './features/calibration/CalibrationPage';

/**
 * Main App Component with Routing
 */

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/calibration" element={<CalibrationPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

