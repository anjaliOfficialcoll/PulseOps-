import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { MonitorsPage } from './pages/monitors/MonitorsPage';
import { MonitorDetailPage } from './pages/monitors/MonitorDetailPage';
import { IncidentsPage } from './pages/incidents/IncidentsPage';
import { IncidentDetailPage } from './pages/incidents/IncidentDetailPage';
import { AnalyticsPage } from './pages/analytics/AnalyticsPage';
import { LogsPage } from './pages/logs/LogsPage';
import { AlertsPage } from './pages/alerts/AlertsPage';
import { TeamPage } from './pages/team/TeamPage';
import { SettingsPage } from './pages/settings/SettingsPage';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Authenticated / Demo Console Shell */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/monitors" element={<MonitorsPage />} />
              <Route path="/monitors/:id" element={<MonitorDetailPage />} />
              <Route path="/incidents" element={<IncidentsPage />} />
              <Route path="/incidents/:id" element={<IncidentDetailPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/logs" element={<LogsPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;

