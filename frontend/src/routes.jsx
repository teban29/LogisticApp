import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtected from "./components/RoleProtected";
import AppLayout from "./layouts/AppLayout";
import ErrorDisplay from "./components/ErrorDisplay";
import NotFound from "./components/NotFound"; // ← Nuevo import

import Login from "./pages/Login";
import Users from "./pages/Users";
import Providers from "./pages/Providers";
import Clients from "./pages/Clients";
import Cargas from "./pages/Cargas";
import CargaDetailPage from "./pages/CargaDetailPage";
import Envios from "./pages/Envios";
import EnvioDetailPage from "./pages/EnvioDetailPage";
import Dashboard from "./pages/Dashboard";

export const router = createBrowserRouter([
  { 
    path: "/login", 
    element: <Login />,
    errorElement: <ErrorDisplay /> // ← Agregar manejo de errores
  },

  {
    element: <ProtectedRoute />,
    errorElement: <ErrorDisplay />, // ← Agregar manejo de errores
    children: [
      {
        element: <AppLayout />,
        errorElement: <ErrorDisplay />, // ← Agregar manejo de errores
        children: [
          {
            element: <RoleProtected allowedRoles={["admin", "operador","conductor", "cliente"]} />,
            errorElement: <ErrorDisplay />, // ← Agregar manejo de errores
            children: [
              { path: "/", element: <Dashboard /> }
            ]
          },
          {
            element: <RoleProtected allowedRoles={["admin"]} />,
            errorElement: <ErrorDisplay />, // ← Agregar manejo de errores
            children: [
              { path: "/usuarios", element: <Users /> }
            ],
          },
          { 
            element: <RoleProtected allowedRoles={["admin", "operador"]} />,
            errorElement: <ErrorDisplay />, // ← Agregar manejo de errores
            children: [
              { path: "/clientes", element: <Clients /> }
            ],
          },
          { 
            element: <RoleProtected allowedRoles={["admin", "operador"]} />,
            errorElement: <ErrorDisplay />, // ← Agregar manejo de errores
            children: [
              { path: "/proveedores", element: <Providers /> }
            ],
          },
          { 
            element: <RoleProtected allowedRoles={["admin", "operador", "cliente", "conductor"]} />,
            errorElement: <ErrorDisplay />, // ← Agregar manejo de errores
            children: [
              { path: "/cargas", element: <Cargas /> }
            ],
          },
          { 
            element: <RoleProtected allowedRoles={["admin", "operador", "cliente", "conductor"]} />,
            errorElement: <ErrorDisplay />, // ← Agregar manejo de errores
            children: [
              { path: "/cargas/:id", element: <CargaDetailPage /> }
            ],
          },
          { 
            element: <RoleProtected allowedRoles={["admin", "operador", "cliente", "conductor"]} />,
            errorElement: <ErrorDisplay />, // ← Agregar manejo de errores
            children: [
              { path: "/envios", element: <Envios /> }
            ],
          },
          { 
            element: <RoleProtected allowedRoles={["admin", "cliente", "conductor", "operador"]} />,
            errorElement: <ErrorDisplay />, // ← Agregar manejo de errores
            children: [
              { path: "/envios/:id", element: <EnvioDetailPage /> }
            ],
          },
        ],
      },
    ],
  },

  // Ruta 404 global - debe ser la última
  { 
    path: "*", 
    element: <NotFound /> 
  }
]);