import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { Outlet } from "react-router-dom";

export default function AppLayout() {
  const [open, setOpen] = useState(false);

  return (
    // Reservamos espacio del sidebar en >= lg
    <div className="min-h-screen bg-gray-50 lg:pl-72">
      {/* Sidebar fijo (w-72) */}
      <Sidebar open={open} setOpen={setOpen} />

      {/* Overlay móvil cuando el sidebar está abierto */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Topbar solo móvil */}
      <div className="lg:hidden sticky top-0 z-10 bg-white border-b">
        <div className="h-14 flex items-center gap-3 px-4">
          <button
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            className="inline-flex items-center justify-center w-10 h-10 border rounded-xl">
            <span className="text-xl">≡</span>
          </button>
          <h1 className="font-semibold">Panel</h1>
        </div>
      </div>

      {/* Contenido */}
      <main className="p-4 lg:p-6">
        <Outlet />
      </main>
    </div>
  );
}
