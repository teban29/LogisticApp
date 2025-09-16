import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleProtected from "./components/RoleProtected";
import AppLayout from "./layouts/AppLayout";

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
  { path: "/login", element: <Login /> },

  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {element: <RoleProtected allowedRoles={["admin", "operador","conductor", "cliente"]} />, children: [{ path: "/", element: <Dashboard /> }]},
          {
            element: <RoleProtected allowedRoles={["admin"]} />,
            children: [{ path: "/usuarios", element: <Users /> }],
          },
          { 
            element: <RoleProtected allowedRoles={["admin", "operador"]} />,
            children: [{ path: "/clientes", element: <Clients /> }],
          },
          { 
            element: <RoleProtected allowedRoles={["admin", "operador"]} />,
            children: [{ path: "/proveedores", element: <Providers /> }],
          },
          { 
            element: <RoleProtected allowedRoles={["admin", "operador", "cliente", "conductor"]} />,
            children: [{ path: "/cargas", element: <Cargas /> }],
          },
          { 
            element: <RoleProtected allowedRoles={["admin", "operador", "cliente", "conductor"]} />,
            children: [{ path: "/cargas/:id", element: <CargaDetailPage /> }],
          },
          { 
            element: <RoleProtected allowedRoles={["admin", "operador", "cliente", "conductor"]} />,
            children: [{ path: "/envios", element: <Envios /> }],
          },
          { 
            element: <RoleProtected allowedRoles={["admin", "cliente", "conductor", "operador"]} />,
            children: [{ path: "/envios/:id", element: <EnvioDetailPage /> }],
          },
        ],
      },
    ],
  },
]);
