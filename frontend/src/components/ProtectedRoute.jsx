import { Navigate, Outlet } from 'react-router-dom'; // ← Agregar Outlet aquí
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { user, loading, isHydrated } = useAuth();

  // Mostrar loading durante la hidratación
  if (!isHydrated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" />;
}