// src/components/ErrorDisplay.jsx
import { useRouteError, Link } from 'react-router-dom';
import { RiHomeLine, RiRefreshLine, RiErrorWarningLine } from 'react-icons/ri';

export default function ErrorDisplay() {
  const error = useRouteError();
  console.error(error);

  const is404 = error?.status === 404 || error?.statusText === 'Not Found';

  if (is404) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <RiErrorWarningLine className="text-4xl text-red-600" />
          </div>

          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Página no encontrada
          </h2>
          
          <p className="text-gray-600 mb-8 leading-relaxed">
            {error?.data?.message || 'La página que buscas no existe.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <RiHomeLine className="text-lg" />
              Ir al Inicio
            </Link>
            
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RiRefreshLine className="text-lg" />
              Recargar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Para otros tipos de errores
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-red-50/30 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
          <RiErrorWarningLine className="text-4xl text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          ¡Oops! Algo salió mal
        </h1>
        
        <p className="text-gray-600 mb-4">
          Ha ocurrido un error inesperado en la aplicación.
        </p>

        <div className="bg-gray-100 p-4 rounded-lg mb-6 text-left">
          <code className="text-sm text-gray-700 break-words">
            {error?.statusText || error?.message || 'Error desconocido'}
          </code>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <RiHomeLine className="text-lg" />
            Ir al Inicio
          </Link>
          
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RiRefreshLine className="text-lg" />
            Recargar
          </button>
        </div>
      </div>
    </div>
  );
}