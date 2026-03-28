import { useState, useEffect, useRef } from "react";
import Modal from "./Modal";
import api from "../api/axios";
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

// Llama directamente a la API sin pasar por el hook global (evita
// interferencia con el loading/error del listado principal de envíos)
const api_escanear = (envioId, codigoBarra) =>
  api.post(`/api/envios/${envioId}/escanear-item/`, {
    codigo_barra: codigoBarra,
    escaneado_por: "Sistema",
  });

const api_estadoVerificacion = (envioId) =>
  api.get(`/api/envios/${envioId}/estado-verificacion/`);

const api_itemsPendientes = (envioId) =>
  api.get(`/api/envios/${envioId}/items-pendientes/`);

const api_forzarCompletar = (envioId) =>
  api.post(`/api/envios/${envioId}/forzar-completar-entrega/`);

const VerificacionEntregaModal = ({
  envio,
  isOpen,
  onClose,
  onEntregaCompletada,
}) => {
  const [estado, setEstado] = useState(null);
  const [itemsPendientes, setItemsPendientes] = useState([]);
  const [codigoEscaneado, setCodigoEscaneado] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);
  const mensajeTimeoutRef = useRef(null);

  useEffect(() => {
    if (isOpen && envio) {
      cargarDatosVerificacion();
      setCodigoEscaneado("");
      setMensaje("");
    }
    return () => {
      if (mensajeTimeoutRef.current) clearTimeout(mensajeTimeoutRef.current);
    };
  }, [isOpen, envio]);

  // Auto-focus input cuando abre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const cargarDatosVerificacion = async () => {
    if (!envio?.id) return;
    try {
      const [estadoRes, pendientesRes] = await Promise.all([
        api_estadoVerificacion(envio.id),
        api_itemsPendientes(envio.id),
      ]);
      setEstado(estadoRes.data);
      setItemsPendientes(pendientesRes.data.pendientes || []);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Error al cargar los datos de verificación.";
      mostrarMensaje(msg, "error");
    }
  };

  const mostrarMensaje = (texto, tipo = "info") => {
    setMensaje(texto);
    setTipoMensaje(tipo);
    if (mensajeTimeoutRef.current) clearTimeout(mensajeTimeoutRef.current);
    mensajeTimeoutRef.current = setTimeout(() => setMensaje(""), 4000);
  };

  const handleEscanear = async () => {
    const codigo = codigoEscaneado.trim();
    if (!codigo) return;

    setLoading(true);
    setCodigoEscaneado("");

    try {
      const res = await api_escanear(envio.id, codigo);
      const resultado = res.data;

      if (resultado.completado) {
        mostrarMensaje("¡Entrega completada! Todos los items verificados", "success");
        await cargarDatosVerificacion();
        setTimeout(() => {
          onEntregaCompletada?.();
          onClose();
        }, 1500);
      } else if (resultado.warning) {
        mostrarMensaje(resultado.warning, "info");
        await cargarDatosVerificacion();
      } else {
        const pct = resultado.porcentaje !== undefined
          ? ` (${Math.round(resultado.porcentaje)}% completado)`
          : "";
        mostrarMensaje(`✓ Item escaneado correctamente${pct}`, "success");
        await cargarDatosVerificacion();
      }
    } catch (err) {
      let errorMsg = "Error al escanear el código.";

      if (err.response?.status === 400) {
        errorMsg =
          err.response.data?.error ||
          err.response.data?.detail ||
          "El código no pertenece a este envío o ya fue escaneado.";
      } else if (err.response?.status === 404) {
        errorMsg = `El código "${codigo}" no fue encontrado en este envío.`;
      } else if (err.response?.status === 403) {
        errorMsg = "No tiene permisos para realizar esta acción.";
      } else if (!err.response) {
        errorMsg = "Error de conexión. Verifique su red e intente nuevamente.";
      } else {
        errorMsg = err.response?.data?.error || err.response?.data?.detail || errorMsg;
      }

      mostrarMensaje(errorMsg, "error");
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
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

    setLoading(true);
    try {
      await api_forzarCompletar(envio.id);
      mostrarMensaje("Entrega completada manualmente", "success");
      await cargarDatosVerificacion();
      setTimeout(() => {
        onEntregaCompletada?.();
        onClose();
      }, 1500);
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Error al forzar la finalización de la entrega.";
      mostrarMensaje(errorMsg, "error");
    } finally {
      setLoading(false);
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

      {/* Mensajes de estado */}
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
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
          <RiQrScanLine className="text-blue-500" />
          Escanear código de barras
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <RiQrScanLine className="h-4 w-4 text-gray-400" />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={codigoEscaneado}
              onChange={(e) => setCodigoEscaneado(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escanear código o ingresar manualmente..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
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
