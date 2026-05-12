import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, Globe, AlertCircle, Loader, CheckCircle } from 'lucide-react';
import customLogo from '../assets/logo.png';
import '../styles/auth.css';

const LANGUAGES = [
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
  { code: 'es-ES', name: 'Español', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'Français', flag: '🇫🇷' },
  { code: 'de-DE', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
  { code: 'ja-JP', name: '日本語', flag: '🇯🇵' },
  { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
  { code: 'hi-IN', name: 'हिंदी', flag: '🇮🇳' },
];

export default function SignupPage() {
  const [step, setStep] = useState('form'); // 'form' | 'verification' | 'success'
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    language: 'en-US',
    agreeToTerms: false
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { signup } = useAuth();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and numbers';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    const result = await signup(
      formData.username,
      formData.email,
      formData.password,
      formData.fullName || formData.username
    );

    if (result.success) {
      setStep('success');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } else {
      setErrors({ submit: result.error });
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
            <div className="auth-feature-icon">⚡</div>
            <p>Get started in seconds</p>
          </div>
          <div className="auth-feature-item">
            <div className="auth-feature-icon">🔒</div>
            <p>Your data is encrypted</p>
          </div>
          <div className="auth-feature-item">
            <div className="auth-feature-icon">📈</div>
            <p>Track your learning progress</p>
          </div>
          <div className="auth-feature-item">
            <div className="auth-feature-icon">🎁</div>
            <p>Free trial, no credit card</p>
          </div>
        </div>
      </div>

      {/* Right Section - Form */}
      <div className="auth-right-section">
        <div className="auth-form-container">
          {step === 'form' && (
            <>
              <h2 className="auth-form-title">Create your account</h2>
              <p className="auth-form-subtitle">Join thousands of learners using Alexandria</p>

              {errors.submit && (
                <div className="auth-error-banner">
                  <AlertCircle size={20} />
                  <span>{errors.submit}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="auth-form">
                {/* Username */}
                <div className="auth-form-group">
                  <label htmlFor="username" className="auth-form-label">Username</label>
                  <div className="auth-input-wrapper">
                    <User size={20} className="auth-input-icon" />
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="john_doe"
                      className={`auth-input ${errors.username ? 'error' : ''}`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.username && <span className="auth-error-text">{errors.username}</span>}
                </div>

                {/* Full Name */}
                <div className="auth-form-group">
                  <label htmlFor="fullName" className="auth-form-label">Full Name (optional)</label>
                  <div className="auth-input-wrapper">
                    <User size={20} className="auth-input-icon" />
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="John Doe"
                      className="auth-input"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="auth-form-group">
                  <label htmlFor="email" className="auth-form-label">Email Address</label>
                  <div className="auth-input-wrapper">
                    <Mail size={20} className="auth-input-icon" />
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className={`auth-input ${errors.email ? 'error' : ''}`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.email && <span className="auth-error-text">{errors.email}</span>}
                </div>

                {/* Language Selection */}
                <div className="auth-form-group">
                  <label htmlFor="language" className="auth-form-label">Preferred Language</label>
                  <div className="auth-input-wrapper">
                    <Globe size={20} className="auth-input-icon" />
                    <select
                      id="language"
                      name="language"
                      value={formData.language}
                      onChange={handleChange}
                      className="auth-input"
                      disabled={isLoading}
                    >
                      {LANGUAGES.map(lang => (
                        <option key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Password */}
                <div className="auth-form-group">
                  <label htmlFor="password" className="auth-form-label">Password</label>
                  <div className="auth-input-wrapper">
                    <Lock size={20} className="auth-input-icon" />
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`auth-input ${errors.password ? 'error' : ''}`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.password && <span className="auth-error-text">{errors.password}</span>}
                  <p className="auth-password-hint">At least 8 characters with uppercase, lowercase, and numbers</p>
                </div>

                {/* Confirm Password */}
                <div className="auth-form-group">
                  <label htmlFor="confirmPassword" className="auth-form-label">Confirm Password</label>
                  <div className="auth-input-wrapper">
                    <Lock size={20} className="auth-input-icon" />
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`auth-input ${errors.confirmPassword ? 'error' : ''}`}
                      disabled={isLoading}
                    />
                  </div>
                  {errors.confirmPassword && <span className="auth-error-text">{errors.confirmPassword}</span>}
                </div>

                {/* Terms */}
                <div className="auth-form-group">
                  <label className="auth-checkbox-label">
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleChange}
                      className="auth-checkbox"
                      disabled={isLoading}
                    />
                    <span>I agree to the <Link to="/terms" className="auth-link">Terms of Service</Link> and <Link to="/privacy" className="auth-link">Privacy Policy</Link></span>
                  </label>
                  {errors.agreeToTerms && <span className="auth-error-text">{errors.agreeToTerms}</span>}
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
                      <span>Creating account...</span>
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              {/* Login Link */}
              <p className="auth-form-footer">
                Already have an account?{' '}
                <Link to="/auth/login" className="auth-link">
                  Sign in
                </Link>
              </p>
            </>
          )}

          {step === 'success' && (
            <div className="auth-success-container">
              <div className="auth-success-icon">
                <CheckCircle size={64} />
              </div>
              <h2 className="auth-success-title">Welcome to Alexandria!</h2>
              <p className="auth-success-message">
                Your account has been created successfully. You'll be redirected to your dashboard in a moment.
              </p>
              <Link to="/dashboard" className="auth-button auth-button-primary">
                Go to Dashboard
              </Link>
            </div>
          )}

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
    </div>
  );
}
