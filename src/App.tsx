import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Processes from './pages/Processes';
import Resources from './pages/Resources';
import DeadlockAnalyzer from './pages/DeadlockAnalyzer';
import Performance from './pages/Performance';
import Alerts from './pages/Alerts';
import { monitoringService } from './services/monitoringService';

function App() {
  useEffect(() => {
    // Initialize monitoring service
    monitoringService.init();

    // Start periodic updates
    const interval = setInterval(() => {
      monitoringService.update();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-[#0a0e1a] overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/processes" element={<Processes />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/deadlock" element={<DeadlockAnalyzer />} />
            <Route path="/performance" element={<Performance />} />
            <Route path="/alerts" element={<Alerts />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
