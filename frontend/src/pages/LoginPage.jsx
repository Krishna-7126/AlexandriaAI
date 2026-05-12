import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, AlertCircle, Loader } from 'lucide-react';
import customLogo from '../assets/logo.png';
import '../styles/auth.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email.trim()) {
      setError('Email is required');
      setIsLoading(false);
      return;
    }

    if (!password) {
      setError('Password is required');
      setIsLoading(false);
      return;
    }

    const result = await login(email, password);
    
    if (result.success) {
      if (rememberMe) {
        localStorage.setItem('alexandria_remember_email', email);
      }
      navigate('/dashboard');
    } else {
      setError(result.error || 'Login failed');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="auth-container">
      {/* Left Section - Brand */}
      <div className="auth-left-section">
        <div className="auth-brand">
          <img src={customLogo} alt="Alexandria" className="auth-logo" />
          <h1 className="auth-brand-name">Alexandria</h1>
          <p className="auth-brand-tagline">Distill the noise. Discover the essence.</p>
        </div>
        
        <div className="auth-features">
          <div className="auth-feature-item">
            <div className="auth-feature-icon">✨</div>
            <p>AI-powered video summaries</p>
          </div>
          <div className="auth-feature-item">
            <div className="auth-feature-icon">🎯</div>
            <p>Smart Q&A and quizzes</p>
          </div>
          <div className="auth-feature-item">
            <div className="auth-feature-icon">🌍</div>
            <p>Multi-language support</p>
          </div>
          <div className="auth-feature-item">
            <div className="auth-feature-icon">📊</div>
            <p>Learning analytics</p>
          </div>
        </div>
      </div>

      {/* Right Section - Form */}
      <div className="auth-right-section">
        <div className="auth-form-container">
          <h2 className="auth-form-title">Welcome Back</h2>
          <p className="auth-form-subtitle">Sign in to your Alexandria account</p>

          {error && (
            <div className="auth-error-banner">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Email Input */}
            <div className="auth-form-group">
              <label htmlFor="email" className="auth-form-label">Email Address</label>
              <div className="auth-input-wrapper">
                <Mail size={20} className="auth-input-icon" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="auth-input"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="auth-form-group">
              <label htmlFor="password" className="auth-form-label">Password</label>
              <div className="auth-input-wrapper">
                <Lock size={20} className="auth-input-icon" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="auth-input"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Remember Me */}
            <div className="auth-form-group auth-form-row">
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="auth-checkbox"
                  disabled={isLoading}
                />
                <span>Remember me</span>
              </label>
              <Link to="/auth/forgot-password" className="auth-forgot-link">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="auth-button auth-button-primary"
            >
              {isLoading ? (
                <>
                  <Loader size={20} className="spinner" />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="auth-divider">
            <span>or</span>
          </div>

          {/* Social Logins (Optional) */}
          <div className="auth-social-buttons">
            <button className="auth-button auth-button-social" disabled={isLoading}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            <button className="auth-button auth-button-social" disabled={isLoading}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              GitHub
            </button>
          </div>

          {/* Sign Up Link */}
          <p className="auth-form-footer">
            Don't have an account?{' '}
            <Link to="/auth/signup" className="auth-link">
              Create one now
            </Link>
          </p>
        </div>

        {/* Footer */}
        <div className="auth-footer-links">
          <a href="/privacy">Privacy Policy</a>
          <span>•</span>
          <a href="/terms">Terms of Service</a>
          <span>•</span>
          <a href="/help">Help Center</a>
        </div>
      </div>
    </div>
  );
}
