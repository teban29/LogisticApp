import { useState, useEffect } from "react";
import { useEnvios } from "../hooks/useEnvios";
import Modal from "./Modal";
import {
  RiQrScanLine,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiInformationLine,
  RiLoader4Line,
  RiCheckLine,
  RiAlertLine,
  RiFileListLine,
  RiShieldCheckLine,
  RiArrowLeftLine,
} from "react-icons/ri";

const VerificacionEntregaModal = ({
  envio,
  isOpen,
  onClose,
  onEntregaCompletada,
}) => {
  const {
    escanearItemVerificacion,
    obtenerVerificacionEstado,
    obtenerItemsPendientesVerificacion,
    forzarEntregaCompletada,
    loading,
    error,
    clearError,
  } = useEnvios();

  const [estado, setEstado] = useState(null);
  const [itemsPendientes, setItemsPendientes] = useState([]);
  const [codigoEscaneado, setCodigoEscaneado] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");

  useEffect(() => {
    if (isOpen && envio) {
      cargarDatosVerificacion();
      setCodigoEscaneado("");
      setMensaje("");
    }
  }, [isOpen, envio]);

  useEffect(() => {
    if (error) {
      mostrarMensaje(error, "error");
      clearError();
    }
  }, [error]);

  const cargarDatosVerificacion = async () => {
    try {
      const [estadoData, pendientesData] = await Promise.all([
        obtenerVerificacionEstado(envio.id),
        obtenerItemsPendientesVerificacion(envio.id),
      ]);

      setEstado(estadoData);
      setItemsPendientes(pendientesData.pendientes || []);
    } catch (err) {
      // El error ya es manejado por el hook
    }
  };

  const mostrarMensaje = (texto, tipo = "info") => {
    setMensaje(texto);
    setTipoMensaje(tipo);
    setTimeout(() => setMensaje(""), 3000);
  };

  const handleEscanear = async () => {
    if (!codigoEscaneado.trim()) return;

    try {
      const resultado = await escanearItemVerificacion(
        envio.id,
        codigoEscaneado.trim()
      );

      if (resultado.completado) {
        mostrarMensaje(
          "¡Entrega completada! Todos los items verificados",
          "success"
        );
        setTimeout(() => {
          onEntregaCompletada();
          onClose();
        }, 1500);
      } else {
        mostrarMensaje("✓ Item escaneado correctamente", "success");
        await cargarDatosVerificacion();
      }
    } catch (err) {
      // El error ya es manejado por el hook
    } finally {
      setCodigoEscaneado("");
    }
  };

  const handleForzarCompletar = async () => {
    if (
      !window.confirm(
        "¿Estás seguro de forzar la finalización de la entrega? Esto marcará todos los items como entregados."
      )
    ) {
      return;
    }

    try {
      await forzarEntregaCompletada(envio.id);
      mostrarMensaje("Entrega completada manualmente", "success");
      setTimeout(() => {
        onEntregaCompletada();
        onClose();
      }, 1500);
    } catch (err) {
      // El error ya es manejado por el hook
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && codigoEscaneado.trim()) {
      handleEscanear();
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <RiQrScanLine className="text-blue-600 text-xl" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Verificación de Entrega
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Guía: {envio?.numero_guia} • Cliente: {envio?.cliente_nombre}
            </p>
          </div>
        </div>
      }
      size="lg"
      preventClose={loading}
      closeConfirmationMessage="¿Está seguro que desea salir? Se perderá el progreso de escaneo.">
      {/* Barra de progreso */}
      {estado && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <RiFileListLine className="text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                Progreso de verificación
              </span>
            </div>
            <span className="text-sm font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              {Math.round(estado.porcentaje_verificacion)}% completado
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${estado.porcentaje_verificacion}%` }}></div>
          </div>

          <p className="text-xs text-gray-600">
            {estado.items_escaneados} de {estado.items_totales} items escaneados
          </p>
        </div>
      )}

      {/* Mensajes */}
      {mensaje && (
        <div
          className={`mb-4 p-3 rounded-lg border ${
            tipoMensaje === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : tipoMensaje === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          } flex items-center gap-2`}>
          {tipoMensaje === "success" ? (
            <RiCheckboxCircleLine className="text-lg flex-shrink-0" />
          ) : tipoMensaje === "error" ? (
            <RiErrorWarningLine className="text-lg flex-shrink-0" />
          ) : (
            <RiInformationLine className="text-lg flex-shrink-0" />
          )}
          <span className="text-sm">{mensaje}</span>
        </div>
      )}

      {/* Scanner input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
          <RiQrScanLine className="text-blue-500" />
          Escanear código de barras
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <RiQrScanLine className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={codigoEscaneado}
              onChange={(e) => setCodigoEscaneado(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escanear código o ingresar manualmente..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              autoFocus
              disabled={loading}
            />
          </div>
          <button
            onClick={handleEscanear}
            disabled={loading || !codigoEscaneado.trim()}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {loading ? (
              <RiLoader4Line className="animate-spin" />
            ) : (
              <RiCheckLine />
            )}
            Escanear
          </button>
        </div>
      </div>

      {/* Items pendientes */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <RiAlertLine className="text-orange-500" />
          Items pendientes de escanear
          <span className="bg-gray-200 text-gray-700 text-sm px-2 py-1 rounded-full ml-2">
            {itemsPendientes.length}
          </span>
        </h3>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {itemsPendientes.length === 0 ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <RiCheckboxCircleLine className="text-green-500 text-2xl mx-auto mb-2" />
              <p className="text-green-800 font-medium">
                ¡Todos los items han sido escaneados!
              </p>
              <p className="text-green-600 text-sm mt-1">
                La entrega está lista para ser completada
              </p>
            </div>
          ) : (
            itemsPendientes.map((item) => (
              <div
                key={item.id}
                className="p-3 border border-orange-200 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">
                      {item.unidad_detalle?.codigo_barra || item.codigo_barra}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {item.producto_nombre}
                    </p>
                    {item.producto_sku && (
                      <p className="text-xs text-gray-500 mt-1">
                        SKU: {item.producto_sku}
                      </p>
                    )}
                  </div>
                  <span className="bg-orange-200 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">
                    Pendiente
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600 flex items-center gap-2">
          <RiInformationLine className="text-gray-400" />
          Escanea todos los items para completar la verificación
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleForzarCompletar}
            disabled={loading || itemsPendientes.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Forzar finalización si hay items faltantes">
            <RiShieldCheckLine />
            Forzar Finalización
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            <RiArrowLeftLine />
            Cerrar
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default VerificacionEntregaModal;
