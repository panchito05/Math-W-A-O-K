import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { ProgressProvider } from './context/ProgressContext';
import { Toaster } from 'sonner';
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import SoonPage from './pages/SoonPage';
import OperationPage from './pages/OperationPage';
import SettingsPage from './pages/SettingsPage';
import ProgressPage from './pages/ProgressPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <ProgressProvider>
            <Toaster richColors position="top-center" />
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="operation/:operationId" element={<OperationPage />} />
                <Route path="soon" element={<SoonPage />} />
                <Route path="profile" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="progress" element={
                  <ProtectedRoute>
                    <ProgressPage />
                  </ProtectedRoute>
                } />
              </Route>
            </Routes>
          </ProgressProvider>
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;