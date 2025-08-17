import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // datos básicos si los quisieras guardar
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Inicialización: si hay access en localStorage, asumimos sesión válida
    const access = localStorage.getItem("access");
    if (access) {
      setUser({});
    }
    setLoading(false);
  }, []);

  const login = async ({ username, password }) => {
    const { data } = await api.post("/api/auth/login/", { username, password });
    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);
    setUser({});
  };

  const logout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, login, logout, loading }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
