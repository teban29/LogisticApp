import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // guardamos { id, username, nombre, apellido, rol, is_active }
  const [loading, setLoading] = useState(true);

  // función para obtener /me
  const fetchMe = async () => {
    try {
      const { data } = await api.get('/api/auth/me/');
      setUser(data);
      return data;
    } catch (err) {
      // si falla (token inválido/expirado), limpiamos
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      setUser(null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
