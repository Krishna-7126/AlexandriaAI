import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Settings, Menu, X } from 'lucide-react';
import customLogo from '../assets/logo.png';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  return (
    <nav style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '80px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 4rem',
      backdropFilter: 'blur(12px)',
      background: 'rgba(251, 249, 246, 0.8)',
      borderBottom: '1px solid rgba(0,0,0,0.05)',
      zIndex: 100
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <img src={customLogo} alt="Alexandria Logo" className="max-h-[35px] w-auto object-contain" style={{ height: '28px', width: 'auto', objectFit: 'contain' }} />
        <Link to="/" style={{ textDecoration: 'none' }}>
          <span className="font-display" style={{ fontSize: '1.5rem', color: 'var(--primary)', fontWeight: 700 }}>Alexandria</span>
        </Link>
      </div>

      {/* Desktop Navigation */}
      <div className="nav-links hidden md:flex" style={{ display: 'flex', gap: '2.5rem', alignItems: 'center' }}>
        {!isAuthenticated ? (
          <>
            <a href="#" className="nav-hover" style={{ textDecoration: 'none', color: 'var(--on-surface-variant)', fontSize: '0.95rem', fontWeight: 500 }}>Platform</a>
            <a href="#" className="nav-hover" style={{ textDecoration: 'none', color: 'var(--on-surface-variant)', fontSize: '0.95rem', fontWeight: 500 }}>Solutions</a>
            <a href="#" className="nav-hover" style={{ textDecoration: 'none', color: 'var(--on-surface-variant)', fontSize: '0.95rem', fontWeight: 500 }}>Pricing</a>
            <a href="#" className="nav-hover" style={{ textDecoration: 'none', color: 'var(--on-surface-variant)', fontSize: '0.95rem', fontWeight: 500 }}>Resources</a>
          </>
        ) : (
          <>
            <Link to="/analyze" className="nav-hover" style={{ textDecoration: 'none', color: 'var(--on-surface-variant)', fontSize: '0.95rem', fontWeight: 500 }}>Analyze</Link>
            <Link to="/library" className="nav-hover" style={{ textDecoration: 'none', color: 'var(--on-surface-variant)', fontSize: '0.95rem', fontWeight: 500 }}>Library</Link>
            <Link to="/dashboard" className="nav-hover" style={{ textDecoration: 'none', color: 'var(--on-surface-variant)', fontSize: '0.95rem', fontWeight: 500 }}>Dashboard</Link>
          </>
        )}
      </div>

      {/* Right Section */}
      <div className="nav-cta-group" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        {isAuthenticated ? (
          <>
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* User Menu */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '1px solid rgba(0,0,0,0.1)', paddingLeft: '1rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>{user?.username}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{user?.email}</div>
              </div>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title={user?.username}
              >
                {user?.username?.charAt(0).toUpperCase() || 'A'}
              </div>
            </div>

            {/* Settings & Logout */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link
                to="/settings"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 1rem',
                  borderRadius: '0.5rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text)',
                  textDecoration: 'none',
                  fontSize: '0.95rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f9f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Settings size={18} />
                <span className="hidden sm:inline">Settings</span>
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 1rem',
                  borderRadius: '0.5rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#ef4444',
                  fontSize: '0.95rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <Link
              to="/auth/login"
              className="ghost"
              style={{ 
                border: 'none', 
                background: 'transparent',
                textDecoration: 'none',
                color: 'var(--text)',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.95rem'
              }}
            >
              Log In
            </Link>
            <Link
              to="/auth/signup"
              className="nav-hover"
              style={{
                background: 'var(--primary)',
                color: '#fff',
                padding: '0.6rem 1.5rem',
                borderRadius: '9999px',
                boxShadow: '0 4px 12px rgba(6, 27, 14, 0.2)',
                textDecoration: 'none',
                fontWeight: 500,
                fontSize: '0.95rem',
                display: 'inline-block'
              }}
            >
              Sign Up
            </Link>
          </>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        style={{
          display: 'none',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text)'
        }}
        className="md:hidden"
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </nav>
  );
}
