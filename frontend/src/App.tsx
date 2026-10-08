import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { UserRole } from './types';
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

// Protected Route Guard with Strict RBAC
interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ color: '#38bdf8', fontSize: '1rem', fontWeight: 600 }}>Loading Nexora session...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect unauthorized user to their respective home dashboard
    if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user.role === 'CONSULTANT') return <Navigate to="/consultant" replace />;
    return <Navigate to="/dashboard" replace />;
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

      {/* Protected Root Layout */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Applicant Portal (APPLICANT, ADMIN) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['APPLICANT', 'ADMIN']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute allowedRoles={['APPLICANT', 'ADMIN']}>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['APPLICANT', 'ADMIN']}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents"
          element={
            <ProtectedRoute allowedRoles={['APPLICANT', 'ADMIN']}>
              <DocumentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/video"
          element={
            <ProtectedRoute allowedRoles={['APPLICANT', 'ADMIN']}>
              <VideoPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/qualification"
          element={
            <ProtectedRoute allowedRoles={['APPLICANT', 'ADMIN']}>
              <QualificationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/opportunities"
          element={
            <ProtectedRoute allowedRoles={['APPLICANT', 'ADMIN']}>
              <OpportunitiesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/next-step"
          element={
            <ProtectedRoute allowedRoles={['APPLICANT', 'ADMIN']}>
              <NextStepPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/journey"
          element={
            <ProtectedRoute allowedRoles={['APPLICANT', 'ADMIN']}>
              <JourneyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cv"
          element={
            <ProtectedRoute allowedRoles={['APPLICANT', 'ADMIN']}>
              <CvBuilderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cover-letter"
          element={
            <ProtectedRoute allowedRoles={['APPLICANT', 'ADMIN']}>
              <CoverLetterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview"
          element={
            <ProtectedRoute allowedRoles={['APPLICANT', 'ADMIN']}>
              <InterviewPrepPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/assistant"
          element={
            <ProtectedRoute allowedRoles={['APPLICANT', 'ADMIN']}>
              <AssistantPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute allowedRoles={['APPLICANT', 'ADMIN']}>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        {/* Consultant Portal (CONSULTANT, ADMIN) */}
        <Route
          path="/consultant"
          element={
            <ProtectedRoute allowedRoles={['CONSULTANT', 'ADMIN']}>
              <ConsultantDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/consultant/applicants"
          element={
            <ProtectedRoute allowedRoles={['CONSULTANT', 'ADMIN']}>
              <ConsultantDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/consultant/reviews"
          element={
            <ProtectedRoute allowedRoles={['CONSULTANT', 'ADMIN']}>
              <ConsultantDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Portal (ADMIN strictly) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/opportunities"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/requirements"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/services"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/routing-rules"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/agents"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
