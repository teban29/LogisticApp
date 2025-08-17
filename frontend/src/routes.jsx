import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./layouts/AppLayout";

import Login from "./pages/Login";
import Users from "./pages/Users";

// Placeholders (puedes crearlos vacíos por ahora)
const Dashboard = () => <div className="text-lg">Bienvenido 👋</div>;
const Clientes = () => <div>Clientes</div>;
const Proveedores = () => <div>Proveedores</div>;
const Inventario = () => <div>Inventario</div>;
const Envios = () => <div>Envíos</div>;
const Configuracion = () => <div>Configuración</div>;

export const router = createBrowserRouter([
  { path: "/login", element: <Login /> },

  {
    element: <ProtectedRoute />, // verifica auth
    children: [
      {
        element: <AppLayout />, // agrega sidebar + shell
        children: [
          { path: "/", element: <Dashboard /> },
          { path: "/usuarios", element: <Users /> },
          { path: "/clientes", element: <Clientes /> },
          { path: "/proveedores", element: <Proveedores /> },
          { path: "/inventario", element: <Inventario /> },
          { path: "/envios", element: <Envios /> },
          { path: "/configuracion", element: <Configuracion /> },
        ],
      },
    ],
  },
]);
