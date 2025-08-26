import { RiCloseLine } from "react-icons/ri";

export default function Modal({ open, title, children, onClose, size = "md" }) {
  if (!open) return null;
  
  // Tamaños predefinidos para diferentes modales
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-95vw" // 95% del viewport width para modales muy grandes
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
      {/* Overlay con backdrop blur para mejor experiencia */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      {/* Contenedor del modal con scroll interno */}
      <div 
        className={`relative z-50 w-full bg-white rounded-xl shadow-xl flex flex-col ${sizeClasses[size]}`}
        style={{ maxHeight: "90vh" }} // Altura máxima del 90% del viewport
      >
        {/* Header fijo */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <button 
            onClick={onClose}
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
  );
}