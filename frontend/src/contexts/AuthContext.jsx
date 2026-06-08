import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, setAuthToken, clearAuthToken } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('curalink_token'));
  const [loading, setLoading] = useState(true);

  // Full state reset for logout / forced expiry
  const resetAuth = useCallback(() => {
    localStorage.removeItem('curalink_token');
    localStorage.removeItem('curalink_user');
    clearAuthToken();
    setToken(null);
    setUser(null);
  }, []);

  // Listen for forced logout from Axios interceptor (401 responses)
  useEffect(() => {
    const handleForcedLogout = () => {
      resetAuth();
    };

    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, [resetAuth]);

  // Restore session from localStorage on mount
  useEffect(() => {
    const restoreSession = async () => {
      const savedToken = localStorage.getItem('curalink_token');
      if (!savedToken) {
        setLoading(false);
        return;
      }

      setAuthToken(savedToken);
      try {
        const res = await authAPI.me();
        setUser(res.data);
        setToken(savedToken);
      } catch {
        // Token expired or invalid — clean up everything
        resetAuth();
      }
      setLoading(false);
    };

    restoreSession();
  }, [resetAuth]);

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('curalink_token', newToken);
    setAuthToken(newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const res = await authAPI.register({ name, email, password });
    const { token: newToken, user: userData } = res.data;
    localStorage.setItem('curalink_token', newToken);
    setAuthToken(newToken);
    setToken(newToken);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    resetAuth();
  }, [resetAuth]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
