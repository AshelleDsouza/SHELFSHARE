import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';

// Public & Student Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import StudentDashboard from './pages/StudentDashboard';
import UploadResourcePage from './pages/UploadResourcePage';
import MyUploadsPage from './pages/MyUploadsPage';
import MyDownloadsPage from './pages/MyDownloadsPage';
import MyBookmarksPage from './pages/MyBookmarksPage';
import MyCollectionsPage from './pages/MyCollectionsPage';
import ExplorePage from './pages/ExplorePage';
import ResourceDetailsPage from './pages/ResourceDetailsPage';
import NotificationsPage from './pages/NotificationsPage';
import UserProfilePage from './pages/UserProfilePage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import ManageUsersPage from './pages/admin/ManageUsersPage';
import ManageResourcesPage from './pages/admin/ManageResourcesPage';
import ReportedResourcesPage from './pages/admin/ReportedResourcesPage';
import ManageSubjectsPage from './pages/admin/ManageSubjectsPage';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              {/* Public Routes */}
              <Route index element={<LandingPage />} />
              <Route path="explore" element={<ExplorePage />} />
              <Route path="resources/:id" element={<ResourceDetailsPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />

              {/* Protected Student Routes */}
              <Route
                path="dashboard"
                element={
                  <ProtectedRoute>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="upload"
                element={
                  <ProtectedRoute>
                    <UploadResourcePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="my-uploads"
                element={
                  <ProtectedRoute>
                    <MyUploadsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="my-downloads"
                element={
                  <ProtectedRoute>
                    <MyDownloadsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="my-bookmarks"
                element={
                  <ProtectedRoute>
                    <MyBookmarksPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="collections"
                element={
                  <ProtectedRoute>
                    <MyCollectionsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="notifications"
                element={
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="profile"
                element={
                  <ProtectedRoute>
                    <UserProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin Routes */}
              <Route
                path="admin"
                element={
                  <AdminRoute>
                    <AdminDashboardPage />
                  </AdminRoute>
                }
              />
              <Route
                path="admin/users"
                element={
                  <AdminRoute>
                    <ManageUsersPage />
                  </AdminRoute>
                }
              />
              <Route
                path="admin/resources"
                element={
                  <AdminRoute>
                    <ManageResourcesPage />
                  </AdminRoute>
                }
              />
              <Route
                path="admin/reports"
                element={
                  <AdminRoute>
                    <ReportedResourcesPage />
                  </AdminRoute>
                }
              />
              <Route
                path="admin/subjects"
                element={
                  <AdminRoute>
                    <ManageSubjectsPage />
                  </AdminRoute>
                }
              />

              {/* Fallback */}
              <Route
                path="*"
                element={
                  <div style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
                    <h2 style={{ color: 'var(--color-primary)', marginBottom: '0.5rem' }}>404 - Page Not Found</h2>
                    <p style={{ color: 'var(--color-text-secondary)' }}>The page you are looking for does not exist or has been moved.</p>
                  </div>
                }
              />
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
