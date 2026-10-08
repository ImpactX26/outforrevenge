import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

// Protected Applicant Pages
import DashboardPage from './pages/DashboardPage';
import OnboardingPage from './pages/OnboardingPage';
import ProfilePage from './pages/ProfilePage';
import DocumentsPage from './pages/DocumentsPage';
import VideoPage from './pages/VideoPage';
import QualificationPage from './pages/QualificationPage';
import OpportunitiesPage from './pages/OpportunitiesPage';
import NextStepPage from './pages/NextStepPage';
import JourneyPage from './pages/JourneyPage';
import CvBuilderPage from './pages/CvBuilderPage';
import CoverLetterPage from './pages/CoverLetterPage';
import InterviewPrepPage from './pages/InterviewPrepPage';
import AssistantPage from './pages/AssistantPage';
import NotificationsPage from './pages/NotificationsPage';

// Consultant & Admin Pages
import ConsultantDashboardPage from './pages/ConsultantDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ color: '#38bdf8', fontSize: '1rem', fontWeight: 600 }}>Loading Nexora session...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected Pages (Inside DashboardLayout) */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/video" element={<VideoPage />} />
        <Route path="/qualification" element={<QualificationPage />} />
        <Route path="/opportunities" element={<OpportunitiesPage />} />
        <Route path="/next-step" element={<NextStepPage />} />
        <Route path="/journey" element={<JourneyPage />} />
        <Route path="/cv" element={<CvBuilderPage />} />
        <Route path="/cover-letter" element={<CoverLetterPage />} />
        <Route path="/interview" element={<InterviewPrepPage />} />
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />

        {/* Consultant Portal */}
        <Route path="/consultant" element={<ConsultantDashboardPage />} />
        <Route path="/consultant/applicants" element={<ConsultantDashboardPage />} />
        <Route path="/consultant/reviews" element={<ConsultantDashboardPage />} />

        {/* Admin Portal */}
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/users" element={<AdminDashboardPage />} />
        <Route path="/admin/opportunities" element={<AdminDashboardPage />} />
        <Route path="/admin/requirements" element={<AdminDashboardPage />} />
        <Route path="/admin/services" element={<AdminDashboardPage />} />
        <Route path="/admin/routing-rules" element={<AdminDashboardPage />} />
        <Route path="/admin/agents" element={<AdminDashboardPage />} />
        <Route path="/admin/analytics" element={<AdminDashboardPage />} />
        <Route path="/admin/audit-logs" element={<AdminDashboardPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
