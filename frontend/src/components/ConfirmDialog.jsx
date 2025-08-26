import Modal from "./Modal";
import { RiErrorWarningLine, RiCloseLine, RiCheckLine } from "react-icons/ri";

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Confirmar acción",
  message = "¿Está seguro de realizar esta acción?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  type = "danger" // danger, warning, info
}) {
  // Configuración según el tipo de diálogo
  const typeConfig = {
    danger: {
      icon: <RiErrorWarningLine className="w-6 h-6 text-red-600" />,
      confirmButton: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
      iconBg: "bg-red-100"
    },
    warning: {
      icon: <RiErrorWarningLine className="w-6 h-6 text-orange-600" />,
      confirmButton: "bg-orange-600 hover:bg-orange-700 focus:ring-orange-500",
      iconBg: "bg-orange-100"
    },
    info: {
      icon: <RiErrorWarningLine className="w-6 h-6 text-blue-600" />,
      confirmButton: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
      iconBg: "bg-blue-100"
    }
  };

  const config = typeConfig[type];

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="text-center">
        {/* Icono de advertencia */}
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${config.iconBg} mb-4`}>
          {config.icon}
        </div>

        {/* Mensaje */}
        <p className="text-gray-700 mb-6 leading-relaxed">
          {message}
        </p>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onClose}
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <RiCloseLine className="w-4 h-4" />
            {cancelText}
          </button>
          
          <button
            onClick={onConfirm}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${config.confirmButton}`}
          >
            <RiCheckLine className="w-4 h-4" />
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}