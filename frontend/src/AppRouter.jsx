import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/authContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import App from './App';
import LoadingSpinner from './components/LoadingSpinner';

// Protected Route Component
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  // Dev-only bypass: allow access without auth when running in dev
  if (import.meta.env.DEV) {
    return children;
  }

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return children;
}

export default function AppRouter() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      {/* Auth Routes - Available to everyone */}
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/signup" element={<SignupPage />} />

      {/* Protected Routes - Require authentication */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <App />
          </ProtectedRoute>
        }
      />

      {/* Redirect root to home or login */}
      <Route
        path="/"
        element={
          import.meta.env.DEV ? <Navigate to="/analyze" replace /> : (isAuthenticated ? <Navigate to="/analyze" replace /> : <Navigate to="/auth/login" replace />)
        }
      />
    </Routes>
  );
}
