import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { setAuthToken, clearAuthToken } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const resetAuth = useCallback(() => {
    clearAuthToken();
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    // 1. Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || 'User',
        });
        setToken(session.access_token);
        setAuthToken(session.access_token);
      }
      setLoading(false);
    });

    // 2. Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name || 'User',
        });
        setToken(session.access_token);
        setAuthToken(session.access_token);
      } else {
        resetAuth();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [resetAuth]);

  // Listen for forced logout from Axios interceptor (401 responses)
  useEffect(() => {
    const handleForcedLogout = async () => {
      await supabase.auth.signOut();
      resetAuth();
    };

    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, [resetAuth]);

  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    const userData = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || 'User',
    };
    return userData;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });
    if (error) throw error;
    
    // If email confirmation is off, the user is immediately signed in
    if (data.session) {
      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || 'User',
        },
        session: data.session
      };
    }
    // If email confirmation is on, session will be null
    return { user: data.user, session: null };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    resetAuth();
  }, [resetAuth]);

  const loginWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    loginWithGoogle,
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
