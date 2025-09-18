import { useState, useRef, useEffect } from "react";
import Modal from "./Modal";
import { useEnvios } from "../hooks/useEnvios";
import { obtenerInfoProductoPorCodigo } from "../api/envios";
import {
  RiBarcodeLine,
  RiAddLine,
  RiCloseLine,
  RiLoader4Line,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiUserLine,
  RiTruckLine,
  RiMapPinLine,
} from "react-icons/ri";

export default function EscaneoMasivoModal({
  open,
  onClose,
  onSuccess,
  preventClose = false,
  closeConfirmationMessage = "¿Está seguro que desea salir? Se perderán los cambios no guardados.",
}) {
  const { procesarEscaneoMasivo, loading } = useEnvios();
  const [codigosData, setCodigosData] = useState([]);
  const [inputCodigo, setInputCodigo] = useState("");
  const [loadingValidacion, setLoadingValidacion] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState("");
  const [duplicateError, setDuplicateError] = useState("");
  const [lastAdded, setLastAdded] = useState(null);
  const [recentlyAdded, setRecentlyAdded] = useState(false);
  const [formData, setFormData] = useState({
    conductor: "",
    placa_vehiculo: "",
    origen: "",
  });
  const [resultado, setResultado] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const inputRef = useRef(null);
  const formRef = useRef(null);
  const focusTimeoutRef = useRef(null);

  useEffect(() => {
    if (open && inputRef.current && !hasChanges) {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
      focusTimeoutRef.current = setTimeout(() => {
        inputRef.current.focus();
      }, 100);
    }

    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, [open, hasChanges]);

  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, []);

  const resetForm = () => {
    setCodigosData([]);
    setInputCodigo("");
    setErrorValidacion("");
    setDuplicateError("");
    setLoadingValidacion(false);
    setFormData({
      conductor: "",
      placa_vehiculo: "",
      origen: "",
    });
    setResultado(null);
    setHasChanges(false);
    setLastAdded(null);
    setRecentlyAdded(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleAgregarCodigo = async () => {
    if (!inputCodigo.trim()) {
      setErrorValidacion("Ingrese un código de barras");
      return;
    }

    if (inputCodigo.trim().length < 3) {
      setErrorValidacion(
        "El código de barras debe tener al menos 3 caracteres"
      );
      return;
    }

    // Verificar si el código ya existe
    const existe = codigosData.some(
      (item) => item.codigo === inputCodigo.trim()
    );

    if (existe) {
      setDuplicateError("Este código ya fue escaneado");
      setTimeout(() => setDuplicateError(""), 3000);
      setInputCodigo("");
      if (inputRef.current) {
        inputRef.current.focus();
      }
      return;
    }

    setLoadingValidacion(true);
    setErrorValidacion("");
    setDuplicateError("");

    try {
      // Obtener información del producto sin validar cliente
      const infoProducto = await obtenerInfoProductoPorCodigo(
        inputCodigo.trim()
      );

      // Agregar el código con su información real o placeholder
      setCodigosData((prev) => [
        ...prev,
        {
          codigo: inputCodigo.trim(),
          producto_nombre: infoProducto.producto_nombre || "Producto",
          precio_referencia: infoProducto.precio_referencia || 0,
          temporal_id: Date.now() + Math.random(),
        },
      ]);

      setLastAdded(inputCodigo.trim());
      setInputCodigo("");
      setErrorValidacion("");
      setHasChanges(true);
      setRecentlyAdded(true);
      setTimeout(() => setRecentlyAdded(false), 300);

      // Enfocar el input después de un pequeño delay
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
      focusTimeoutRef.current = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    } catch (err) {
      console.error("Error al obtener info del producto:", err);
      // Si hay error, agregar con placeholder
      setCodigosData((prev) => [
        ...prev,
        {
          codigo: inputCodigo.trim(),
          producto_nombre: "Producto",
          precio_referencia: 0,
          temporal_id: Date.now() + Math.random(),
        },
      ]);
      
      setLastAdded(inputCodigo.trim());
      setInputCodigo("");
      setHasChanges(true);
      setRecentlyAdded(true);
      setTimeout(() => setRecentlyAdded(false), 300);

      // Enfocar el input después de un pequeño delay
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
      focusTimeoutRef.current = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    } finally {
      setLoadingValidacion(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAgregarCodigo();
    }
  };

  const handleRemoverCodigo = (index) => {
    setCodigosData((prev) => prev.filter((_, i) => i !== index));
    setHasChanges(true);

    // Mantener el foco en el input principal
    if (inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 10);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  const handleOtherFieldFocus = () => {
    // Cuando el usuario hace clic en otro campo, no hacer nada
  };

  const handleOtherFieldKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (codigosData.length === 0) {
      alert("Debe agregar al menos un código de barras");
      return;
    }

    if (!formData.conductor || !formData.placa_vehiculo || !formData.origen) {
      alert("Complete todos los campos de información del envío");
      return;
    }

    try {
      const payload = {
        codigos_barras: codigosData.map((item) => item.codigo),
        conductor: formData.conductor,
        placa_vehiculo: formData.placa_vehiculo,
        origen: formData.origen,
      };

      const resultado = await procesarEscaneoMasivo(payload);
      setResultado(resultado);

      if (resultado.envios_creados_ids?.length > 0) {
        setTimeout(() => {
          resetForm();
          if (onSuccess) {
            onSuccess();
          }
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error("Error en escaneo masivo:", error);
    }
  };

  const handleFormKeyPress = (e) => {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
      e.preventDefault();
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Escaneo Masivo de Unidades"
      size="xl"
      preventClose={preventClose || (hasChanges && !loading)}
      closeConfirmationMessage={closeConfirmationMessage}>
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        onKeyPress={handleFormKeyPress}
        className="space-y-6">
        {/* Sección de información del envío */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-3">
            Información común para todos los envíos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conductor <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <RiUserLine className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="conductor"
                  value={formData.conductor}
                  onChange={handleInputChange}
                  onFocus={handleOtherFieldFocus}
                  onKeyPress={handleOtherFieldKeyPress}
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="Nombre del conductor"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Placa del vehículo <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <RiTruckLine className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="placa_vehiculo"
                  value={formData.placa_vehiculo}
                  onChange={handleInputChange}
                  onFocus={handleOtherFieldFocus}
                  onKeyPress={handleOtherFieldKeyPress}
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="Ej: ABC123"
                  disabled={loading}
                />
              </div>
            </div>
            {/* Esteban */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Origen <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <RiMapPinLine className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  name="origen"
                  value={formData.origen}
                  onChange={handleInputChange}
                  onFocus={handleOtherFieldFocus}
                  onKeyPress={handleOtherFieldKeyPress}
                  required
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="Lugar de origen del envío"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sección de escaneo */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Escanear códigos de barras (todos los clientes)
          </h3>

          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código de barras (presione Enter para agregar)
              {loadingValidacion && (
                <span className="ml-2 text-blue-600 text-xs">
                  Obteniendo producto...
                </span>
              )}
            </label>
            <div className="flex gap-3">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <RiBarcodeLine className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    ref={inputRef}
                    aria-label="Código de barras"
                    aria-describedby={
                      errorValidacion
                        ? "error-message"
                        : duplicateError
                        ? "duplicate-error"
                        : undefined
                    }
                    value={inputCodigo}
                    onChange={(e) => {
                      setInputCodigo(e.target.value);
                      setErrorValidacion("");
                      setDuplicateError("");
                    }}
                    onKeyPress={handleKeyPress}
                    className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                      recentlyAdded ? 'ring-2 ring-green-500' : ''
                    }`}
                    placeholder="Escanear código de barras de cualquier cliente"
                    disabled={loading || loadingValidacion}
                  />
                </div>
                {duplicateError && (
                  <span id="duplicate-error" className="text-red-500 text-xs mt-1 block animate-pulse">
                    {duplicateError}
                  </span>
                )}
                {errorValidacion && (
                  <span id="error-message" className="text-red-500 text-xs mt-1 block">
                    {errorValidacion}
                  </span>
                )}
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAgregarCodigo}
                  disabled={!inputCodigo.trim() || loading || loadingValidacion}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {loadingValidacion ? (
                    <>
                      <RiLoader4Line className="animate-spin" />
                      Obteniendo...
                    </>
                  ) : (
                    <>
                      <RiAddLine />
                      Agregar
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Puede escanear unidades de diferentes clientes. El sistema creará
              envíos automáticamente por cada cliente.
            </p>
          </div>

          {/* Lista de códigos escaneados */}
          {codigosData.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-700">
                Códigos escaneados ({codigosData.length}):
              </h4>

              <div className="max-h-60 overflow-y-auto border rounded-lg divide-y">
                {codigosData.map((item, index) => (
                  <div
                    key={item.temporal_id}
                    className={`flex items-center gap-3 p-3 bg-white transition-all duration-300 ${
                      lastAdded === item.codigo ? 'bg-green-50 border-l-4 border-l-green-500' : ''
                    }`}>
                    <div className="flex-1">
                      {/* NOMBRE DEL PRODUCTO EN GRANDE */}
                      <p className="font-medium text-gray-900 mb-1">
                        {item.producto_nombre}
                      </p>

                      {/* CÓDIGO DE BARRAS PEQUEÑO */}
                      <p className="font-mono text-xs bg-gray-100 p-1.5 rounded text-gray-600">
                        {item.codigo}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoverCodigo(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors self-center flex-shrink-0"
                      disabled={loading}
                      title="Remover item">
                      <RiCloseLine />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Resultado del procesamiento */}
        {resultado && (
          <div
            className={`p-4 rounded-lg ${
              resultado.envios_creados_ids?.length > 0
                ? "bg-green-50 border border-green-200"
                : "bg-yellow-50 border border-yellow-200"
            }`}>
            <div className="flex items-center gap-3">
              {resultado.envios_creados_ids?.length > 0 ? (
                <>
                  <RiCheckboxCircleLine className="text-green-600 text-xl" />
                  <div>
                    <p className="font-medium text-green-900">
                      {resultado.message}
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      IDs de envíos creados:{" "}
                      {resultado.envios_creados_ids.join(", ")}
                    </p>
                    <p className="text-xs text-green-600 mt-2">
                      El modal se cerrará automáticamente...
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <RiErrorWarningLine className="text-yellow-600 text-xl" />
                  <p className="text-yellow-900">{resultado.message}</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}>
            Cancelar
          </button>

          <button
            type="submit"
            disabled={loading || codigosData.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {loading ? (
              <>
                <RiLoader4Line className="animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <RiBarcodeLine />
                Crear envíos ({codigosData.length} unidades)
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}