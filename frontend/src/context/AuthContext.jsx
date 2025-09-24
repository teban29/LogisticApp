import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshToken = async () => {
    try {
      const refresh = localStorage.getItem('refresh');
      if (!refresh) throw new Error('No refresh token');
      
      const { data } = await api.post('/api/auth/token/refresh/', { refresh });
      localStorage.setItem('access', data.access);
      return data.access;
    } catch (err) {
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      setUser(null);
      throw err;
    }
  };

  const fetchMe = async () => {
    try {
      const { data } = await api.get('/api/auth/me/');
      setUser(data);
      return data;
    } catch (err) {
      if (err.response?.status === 401) {
        // Token expirado, intentar renovar
        try {
          await refreshToken();
          const { data } = await api.get('/api/auth/me/');
          setUser(data);
          return data;
        } catch (refreshErr) {
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          setUser(null);
          throw refreshErr;
        }
      }
      throw err;
    }
  };

  useEffect(() => {
    const init = async () => {
      const access = localStorage.getItem('access');
      if (access) {
        try {
          await fetchMe();
        } catch (_) {
          // ya manejado dentro de fetchMe
        }
      }
      setLoading(false);
    };
    init();

    // Verificar token periódicamente (cada 30 minutos)
    const interval = setInterval(async () => {
      const access = localStorage.getItem('access');
      if (access) {
        try {
          await fetchMe();
        } catch (_) {
          // Silencioso, no hacer nada si falla
        }
      }
    }, 30 * 60 * 1000); // 30 minutos

    return () => clearInterval(interval);
  }, []);

  const login = async ({ username, password }) => {
    const { data } = await api.post('/api/auth/login/', { username, password });
    localStorage.setItem('access', data.access);
    localStorage.setItem('refresh', data.refresh);
    const me = await fetchMe();
    setUser(me);
  };

  const logout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    setUser(null);
  };

  const value = useMemo(() => ({ user, login, logout, loading, fetchMe }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);