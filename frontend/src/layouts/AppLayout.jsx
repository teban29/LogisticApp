import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";
import { RiMenuLine, RiNotification3Line, RiSearchLine } from "react-icons/ri";
import { useAuth } from "../context/AuthContext";

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const userInitials = (user?.nombre?.[0] || "").concat(user?.apellido?.[0] || "").toUpperCase() || "US";

  return (
    // Layout principal con fondo coherente
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 lg:pl-72">
      {/* Sidebar fijo */}
      <Sidebar open={open} setOpen={setOpen} />

      {/* Overlay móvil cuando el sidebar está abierto */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Topbar responsivo */}
      <div className="lg:hidden sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="h-16 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              aria-label="Abrir menú"
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <RiMenuLine className="text-xl text-gray-700" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                <span className="text-white font-bold text-sm">🚚</span>
              </div>
              <h1 className="font-semibold text-gray-900">LogísticApp</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors">
              <RiNotification3Line className="text-xl" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            {user && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-medium text-xs">
                  {userInitials}
                </div>
                <div className="text-xs text-right leading-tight">
                  <div className="font-medium text-gray-900 truncate max-w-[120px]">
                    {user.nombre} {user.apellido}
                  </div>
                  <div className="text-gray-500 capitalize">{user.rol}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Topbar para desktop */}
      <div className="hidden lg:block fixed top-0 right-0 left-72 bg-white border-b border-gray-200 z-10 h-16">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-medium text-sm">
                {userInitials}
              </div>
              <div className="text-sm">
                <div className="font-medium text-gray-900">{user ? `${user.nombre} ${user.apellido}` : "Usuario"}</div>
                <div className="text-gray-500 capitalize">{user?.rol || ""}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <main className="pt-4 lg:pt-20 pb-6 px-4 lg:px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <Outlet />
        </div>
      
      </main>
    </div>
  );
}