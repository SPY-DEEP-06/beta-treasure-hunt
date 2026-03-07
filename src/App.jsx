import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ParticipantPortal from './pages/ParticipantPortal';
import AdminPortal from './pages/AdminPortal';
import LeaderboardPortal from './pages/LeaderboardPortal';
import Login from './pages/Login';
import QRPrintView from './pages/QRPrintView';
import AntiCheat from './components/AntiCheat';

function App() {
  return (
    <AuthProvider>
      <AntiCheat />
      <Router>
        <Routes>
          <Route path="/" element={<ParticipantPortal />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<AdminPortal />} />
          <Route path="/leaderboard" element={<LeaderboardPortal />} />
          <Route path="/qr-print" element={<QRPrintView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
