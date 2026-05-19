import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { Mail, Lock, Eye, EyeOff, Loader } from 'lucide-react';
import customLogo from '../assets/logo.png';
import '../styles/auth.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      navigate('/dashboard');
    } else {
      setError(result.error || 'Login failed');
    }

    setIsLoading(false);
  };

  return (
    <div className="login-bg">
      <div className="login-center">
        <div className="login-card">
          <div className="login-card-header">
            <img src={customLogo} alt="Alexandria" className="login-logo" />
            <h1>Welcome back</h1>
            <p className="muted">Sign in to continue your journey with Alexandria.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && <div className="auth-error-banner"><span>{error}</span></div>}

            <label className="label">Email address</label>
            <div className="input-with-icon">
              <Mail className="icon" />
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <label className="label">Password</label>
            <div className="input-with-icon">
              <Lock className="icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <button type="button" className="icon-btn" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>

            <div className="login-actions">
              <div className="remember">
                <input id="remember" type="checkbox" />
                <label htmlFor="remember">Remember me</label>
              </div>
              <Link to="/auth/forgot-password" className="forgot">Forgot password?</Link>
            </div>

            <button className="primary-btn" type="submit" disabled={isLoading}>
              {isLoading ? <><Loader className="spinner" /> Signing in...</> : 'Sign in'}
            </button>
          </form>

          <div className="divider">or continue with</div>

          <div className="social-row">
            <button className="social-btn google">Google</button>
            <button className="social-btn github">GitHub</button>
            <button className="social-btn microsoft">Microsoft</button>
          </div>

          <div className="signup-link">Don't have an account? <Link to="/auth/signup">Sign up</Link></div>
        </div>
      </div>

      <footer className="login-footer">
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms of Service</a>
      </footer>
    </div>
  );
}
