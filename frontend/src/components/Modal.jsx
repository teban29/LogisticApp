// components/Modal.jsx
import { useState, useEffect } from "react";
import { RiCloseLine, RiAlertLine } from "react-icons/ri";

export default function Modal({ 
  open, 
  title, 
  children, 
  onClose, 
  size = "md",
  preventClose = false,
  closeConfirmationMessage = "¿Está seguro que desea salir? Se perderán los cambios no guardados."
}) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Tamaños predefinidos
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-95vw"
  };

  const handleOverlayClick = (e) => {
    if (preventClose && e.target === e.currentTarget) {
      setShowConfirmation(true);
    } else if (!preventClose) {
      onClose();
    }
  };

  const handleCloseClick = () => {
    if (preventClose) {
      setShowConfirmation(true);
    } else {
      onClose();
    }
  };

  const confirmClose = () => {
    setIsClosing(true);
    setShowConfirmation(false);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  const cancelClose = () => {
    setShowConfirmation(false);
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  // Si el modal no está abierto, no renderizar nada
  if (!open) return null;

  return (
    <>
      {/* Modal principal */}
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
        {/* Overlay con backdrop blur */}
        <div 
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity ${
            isClosing ? 'opacity-0' : 'opacity-100'
          }`}
          onClick={handleOverlayClick}
        />
        
        {/* Contenedor del modal */}
        <div 
          className={`relative z-50 w-full bg-white rounded-xl shadow-xl flex flex-col ${
            sizeClasses[size]
          } ${
            isClosing ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'
          } transition-all duration-300`}
          style={{ maxHeight: "90vh" }}
        >
          {/* Header fijo */}
          <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200 flex-shrink-0">
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
            <button 
              onClick={handleCloseClick}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Cerrar modal"
            >
              <RiCloseLine className="w-5 h-5" />
            </button>
          </div>

          {/* Contenido con scroll */}
          <div className="flex-1 overflow-y-auto p-6 pt-4">
            {children}
          </div>
        </div>
      </div>

      {/* Modal de confirmación de cierre */}
      {showConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={cancelClose}
          />
          
          <div className="relative z-60 w-full max-w-md bg-white rounded-xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <RiAlertLine className="text-yellow-600 text-2xl" />
              <h3 className="text-lg font-semibold text-gray-900">Confirmar salida</h3>
            </div>
            
            <p className="text-gray-600 mb-6">{closeConfirmationMessage}</p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelClose}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmClose}
                className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 transition-colors"
              >
                Salir sin guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}