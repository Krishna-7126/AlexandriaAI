import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('alexandria_token');
    const savedUser = localStorage.getItem('alexandria_user');
    
    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);
      } catch (e) {
        console.error('Failed to restore session:', e);
        localStorage.removeItem('alexandria_token');
        localStorage.removeItem('alexandria_user');
      }
    }
    setLoading(false);
  }, []);

  const signup = useCallback(async (username, email, password, fullName = '') => {
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001'}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          password,
          full_name: fullName || username
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Signup failed');
      }

      const data = await response.json();
      const userData = {
        user_id: data.user_id,
        username: data.username,
        email: data.email,
        preferred_language: data.preferred_language,
        full_name: data.full_name || data.username
      };

      setToken(data.access_token);
      setUser(userData);
      
      // Persist to localStorage
      localStorage.setItem('alexandria_token', data.access_token);
      localStorage.setItem('alexandria_user', JSON.stringify(userData));

      return { success: true, user: userData };
    } catch (err) {
      setError(err.message);
      console.error('Signup error:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001'}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }

      const data = await response.json();
      const userData = {
        user_id: data.user_id,
        username: data.username,
        email: data.email,
        preferred_language: data.preferred_language,
        full_name: data.full_name || data.username
      };

      setToken(data.access_token);
      setUser(userData);
      
      // Persist to localStorage
      localStorage.setItem('alexandria_token', data.access_token);
      localStorage.setItem('alexandria_user', JSON.stringify(userData));

      return { success: true, user: userData };
    } catch (err) {
      setError(err.message);
      console.error('Login error:', err);
      return { success: false, error: err.message };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setError(null);
    localStorage.removeItem('alexandria_token');
    localStorage.removeItem('alexandria_user');
  }, []);

  const updatePreferences = useCallback(async (preferences) => {
    if (!token) return { success: false, error: 'Not authenticated' };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8001'}/auth/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(preferences)
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      // Update user state with new preferences
      const updatedUser = { ...user, ...preferences };
      setUser(updatedUser);
      localStorage.setItem('alexandria_user', JSON.stringify(updatedUser));

      return { success: true };
    } catch (err) {
      console.error('Update preferences error:', err);
      return { success: false, error: err.message };
    }
  }, [token, user]);

  const updateLanguage = useCallback((language) => {
    if (user) {
      const updatedUser = { ...user, preferred_language: language };
      setUser(updatedUser);
      localStorage.setItem('alexandria_user', JSON.stringify(updatedUser));
      
      // Try to persist on backend if authenticated
      if (token) {
        updatePreferences({ preferred_language: language });
      }
    }
  }, [user, token, updatePreferences]);

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!token,
    signup,
    login,
    logout,
    updatePreferences,
    updateLanguage,
    setError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
