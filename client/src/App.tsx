import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/public/LandingPage.js';
import { LoginPage } from './pages/public/LoginPage.js';
import { SignupPage } from './pages/public/SignupPage.js';
import { ForgotPasswordPage } from './pages/public/ForgotPasswordPage.js';
import { ResetPasswordPage } from './pages/public/ResetPasswordPage.js';

import { AppLayout } from './components/layout/AppLayout.js';
import { ProtectedRoute } from './components/layout/ProtectedRoute.js';
import { OnboardingPage } from './pages/app/OnboardingPage.js';
import { DashboardPage } from './pages/app/DashboardPage.js';
import { SubjectsPage } from './pages/app/SubjectsPage.js';
import { SubjectDetailPage } from './pages/app/SubjectDetailPage.js';
import { TopicsPage } from './pages/app/TopicsPage.js';
import { TimetablePage } from './pages/app/TimetablePage.js';
import { StudyPlanPage } from './pages/app/StudyPlanPage.js';
import { ProgressPage } from './pages/app/ProgressPage.js';
import { FocusPage } from './pages/app/FocusPage.js';
import { SettingsPage } from './pages/app/SettingsPage.js';
import { NotesPage } from './pages/app/NotesPage.js';
import { HistoryPage } from './pages/app/HistoryPage.js';
import { MusicPage } from './pages/app/MusicPage.js';
import { NotFoundPage } from './pages/NotFoundPage.js';

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Standalone Protected Route: Onboarding */}
      <Route
        path="/app/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />

      {/* Protected App Routes inside Workspace Layout */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="subjects" element={<SubjectsPage />} />
        <Route path="subjects/:subjectId" element={<SubjectDetailPage />} />
        <Route path="topics" element={<TopicsPage />} />
        <Route path="timetable" element={<TimetablePage />} />
        <Route path="study-plan" element={<StudyPlanPage />} />
        <Route path="progress" element={<ProgressPage />} />
        <Route path="notes" element={<NotesPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="music" element={<MusicPage />} />
        <Route path="focus" element={<FocusPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* 404 Catch-All */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;
