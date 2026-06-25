// FILE: client/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';


const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // Auto-subscribe to push notifications after login

  useEffect(() => {
    // Skip restoreSession on the OAuth callback page —
    // AuthCallback.jsx handles login itself; running /auth/refresh
    // here would race with and overwrite the token from the URL.
    if (window.location.pathname.startsWith('/auth/callback')) {
      setLoading(false);
      return;
    }

    const restoreSession = async () => {
      try {
        const res   = await api.post('/auth/refresh');
        window.__aura_access_token__ = res.data.accessToken;
        const meRes = await api.get('/auth/me');
        setUser(meRes.data.user);
      } catch {
        window.__aura_access_token__ = null;
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = useCallback((accessToken, userData) => {
    window.__aura_access_token__ = accessToken;
    setUser(userData);
    setLoading(false);
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch {}
    window.__aura_access_token__ = null;
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default AuthContext;