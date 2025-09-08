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
// Placeholders (puedes crearlos vacíos por ahora)
const Dashboard = () => <div className="text-lg">Bienvenido 👋</div>;
const Clientes = () => <div>Clientes</div>;
const Proveedores = () => <div>Proveedores</div>;
const Configuracion = () => <div>Configuración</div>;

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },

  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/", element: <Dashboard /> },
          {
            element: <RoleProtected allowedRoles={["admin"]} />,
            children: [{ path: "/usuarios", element: <Users /> }],
          },
          { path: "/clientes", element: <Clients /> },
          { path: "/proveedores", element: <Providers /> },
          { path: "/cargas", element: <Cargas /> },
          { path: "/cargas/:id", element: <CargaDetailPage /> },
          { path: "/envios", element: <Envios /> },
          { path: "/envios/:id", element: <EnvioDetailPage /> },
          { path: "/configuracion", element: <Configuracion /> },
        ],
      },
    ],
  },
]);
