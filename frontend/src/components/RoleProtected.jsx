import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleProtected({ allowedRoles = [] }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles.length === 0) return <Outlet />;
  if (!allowedRoles.includes(user.rol)) return <Navigate to="/" replace />;

  return <Outlet />;
}
