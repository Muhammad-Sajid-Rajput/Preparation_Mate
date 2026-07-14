import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import RouteLoader from '../components/ui/RouteLoader';

// Route Guards
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';

// Layout
import AppShell from '../components/layout/AppShell';

// Public Pages
const Landing = lazy(() => import('../pages/landing/Landing'));
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword'));
const PasswordResetSuccess = lazy(() => import('../pages/auth/PasswordResetSuccess'));

// Dashboard & Core Pages
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'));
const KnowledgeGaps = lazy(() => import('../pages/gaps/KnowledgeGaps'));
const AIAssistant = lazy(() => import('../pages/chat/AIAssistant'));
const Profile = lazy(() => import('../pages/account/Profile'));
const NotificationSettings = lazy(() => import('../pages/account/NotificationSettings'));
const AccountSettings = lazy(() => import('../pages/account/AccountSettings'));

// Notes Pages
const NotesList = lazy(() => import('../pages/notes/NotesList'));
const NoteDetail = lazy(() => import('../pages/notes/NoteDetail'));

// Quizzes Pages
const QuizHistory = lazy(() => import('../pages/quizzes/QuizHistory'));
const QuizGenerate = lazy(() => import('../pages/quizzes/QuizGenerate'));
const QuizTaking = lazy(() => import('../pages/quizzes/QuizTaking'));
const QuizResults = lazy(() => import('../pages/quizzes/QuizResults'));

// Planner Pages
const ActivePlan = lazy(() => import('../pages/planner/ActivePlan'));
const CreatePlan = lazy(() => import('../pages/planner/CreatePlan'));

// Interview Pages
const InterviewSetup = lazy(() => import('../pages/interview/InterviewSetup'));
const InterviewQA = lazy(() => import('../pages/interview/InterviewQA'));
const InterviewHistory = lazy(() => import('../pages/interview/InterviewHistory'));

// Resume Analyzer Pages
const ResumeUpload = lazy(() => import('../pages/resume/ResumeUpload'));
const ResumeAnalysis = lazy(() => import('../pages/resume/ResumeAnalysis'));

// Admin Page
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));

// 404 Page
const NotFound = lazy(() => import('../pages/NotFound'));

const AppRoutes = () => {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route path={ROUTES.HOME} element={<Landing />} />
        <Route path={ROUTES.LOGIN} element={<Login />} />
        <Route path={ROUTES.REGISTER} element={<Register />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
        <Route path={ROUTES.PASSWORD_RESET_SUCCESS} element={<PasswordResetSuccess />} />

        {/* App Shell Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppShell />}>
            {/* Default /app -> dashboard */}
            <Route index element={<Navigate to={ROUTES.DASHBOARD} replace />} />
            
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* Notes */}
            <Route path="notes" element={<NotesList />} />
            <Route path="notes/:id" element={<NoteDetail />} />
            
            {/* Quizzes */}
            <Route path="quizzes" element={<QuizHistory />} />
            <Route path="quizzes/generate" element={<QuizGenerate />} />
            <Route path="quizzes/:id" element={<QuizTaking />} />
            <Route path="quizzes/:id/results" element={<QuizResults />} />
            
            {/* Gaps, Chat, Planner */}
            <Route path="gaps" element={<KnowledgeGaps />} />
            <Route path="chat" element={<AIAssistant />} />
            <Route path="planner" element={<ActivePlan />} />
            <Route path="planner/create" element={<CreatePlan />} />
            
            {/* Interview */}
            <Route path="interview" element={<InterviewSetup />} />
            <Route path="interview/:id" element={<InterviewQA />} />
            <Route path="interview/history" element={<InterviewHistory />} />
            
            {/* Resume */}
            <Route path="resume" element={<ResumeUpload />} />
            <Route path="resume/:id" element={<ResumeAnalysis />} />
            
            {/* User Account/Profile */}
            <Route path="profile" element={<Profile />} />
            <Route path="notifications" element={<NotificationSettings />} />
            <Route path="settings" element={<AccountSettings />} />
          </Route>
        </Route>

        {/* Admin Dashboard */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AppShell />}>
            <Route index element={<Navigate to={ROUTES.ADMIN} replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
          </Route>
        </Route>

        {/* Fallback Catch-all → 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
