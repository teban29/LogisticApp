// src/components/NotFound.jsx
import { Link } from 'react-router-dom';
import { RiHomeLine, RiArrowLeftLine, RiErrorWarningLine } from 'react-icons/ri';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Icono de error */}
        <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
          <RiErrorWarningLine className="text-4xl text-red-600" />
        </div>

        {/* Mensaje */}
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Página no encontrada
        </h2>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
          Verifica la URL o navega usando el menú.
        </p>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <RiHomeLine className="text-lg" />
            Ir al Inicio
          </Link>
          
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RiArrowLeftLine className="text-lg" />
            Volver Atrás
          </button>
        </div>

        {/* Información adicional */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>¿Necesitas ayuda?</strong> Si crees que esto es un error, 
            contacta al administrador del sistema.
          </p>
        </div>
      </div>
    </div>
  );
}