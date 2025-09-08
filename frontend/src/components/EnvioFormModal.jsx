import { useEffect, useState } from "react";
import Modal from "./Modal";
import Select from "react-select";
import { listClients } from "../api/partners";
import { useEnvios } from "../hooks/useEnvios";
import { validarUnidadParaEnvio } from "../api/envios";
import {
  RiUserLine,
  RiTruckLine,
  RiMapPinLine,
  RiBarcodeLine,
  RiMoneyDollarCircleLine,
  RiCloseLine,
  RiSaveLine,
  RiLoader4Line,
  RiAddLine,
  RiSubtractLine,
  RiErrorWarningLine,
} from "react-icons/ri";

const initialForm = {
  cliente: null,
  conductor: "",
  placa_vehiculo: "",
  origen: "",
  items_data: [],
};

export default function EnvioFormModal({ open, onClose, onSubmit, editing }) {
  const isEdit = Boolean(editing?.id);
  const [form, setForm] = useState(initialForm);
  const [clientOptions, setClientOptions] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [codigoBarras, setCodigoBarras] = useState("");
  const [errorScan, setErrorScan] = useState("");
  const [loadingValidation, setLoadingValidation] = useState(false);
  const { loading: enviosLoading } = useEnvios();
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const fetchClients = async () => {
      setLoadingClients(true);
      try {
        const data = await listClients({
          page: 1,
          search: "",
          is_active: true,
        });
        const clients = data.results || data;
        setClientOptions(
          clients.map((c) => ({ value: c.id, label: `${c.nombre} - ${c.nit}` }))
        );
      } catch (err) {
        console.error("Error loading clients:", err);
      } finally {
        setLoadingClients(false);
      }
    };

    if (open) fetchClients();
  }, [open]);

  useEffect(() => {
    if (isEdit && editing) {
      console.log("Datos de edición recibidos:", editing);

      // Transformar los items existentes - MEJORADO
      const itemsTransformados = (editing.items || []).map((item) => {
        const codigoBarra =
          item.unidad_codigo ||
          item.unidad?.codigo_barra ||
          item.unidad_detalle?.codigo_barra ||
          "";

        // Obtener el nombre del producto de múltiples fuentes posibles
        const productoNombre =
          item.producto_nombre ||
          item.unidad?.carga_item?.producto?.nombre ||
          item.unidad_detalle?.carga_item?.producto?.nombre ||
          "Producto";

        console.log(
          "Transformando item:",
          item.id,
          "Código:",
          codigoBarra,
          "Producto:",
          productoNombre
        );

        return {
          id: item.id,
          unidad_codigo: codigoBarra,
          valor_unitario: Number(item.valor_unitario) || 0,
          producto_nombre: productoNombre, // ← Aseguramos que siempre tenga nombre
          temporal_id: item.id || `existing_${item.id}`,
        };
      });

      // Filtrar items que no tengan código de barras válido
      const itemsValidos = itemsTransformados.filter(
        (item) => item.unidad_codigo
      );

      console.log("Items transformados:", itemsValidos);

      setForm({
        cliente: editing.cliente,
        conductor: editing.conductor || "",
        placa_vehiculo: editing.placa_vehiculo || "",
        origen: editing.origen || "",
        items_data: itemsValidos,
      });
    } else {
      setForm(initialForm);
    }
    setCodigoBarras("");
    setErrorScan("");
  }, [editing, open, isEdit]);

  // Agregar este useEffect después del useEffect existente que carga los datos de edición
  useEffect(() => {
    if (open) {
      const initialFormData =
        isEdit && editing
          ? {
              cliente: editing.cliente,
              conductor: editing.conductor || "",
              placa_vehiculo: editing.placa_vehiculo || "",
              origen: editing.origen || "",
              items_data: (editing.items || [])
                .map((item) => {
                  const codigoBarra =
                    item.unidad_codigo ||
                    item.unidad?.codigo_barra ||
                    item.unidad_detalle?.codigo_barra ||
                    "";
                  const productoNombre =
                    item.producto_nombre ||
                    item.unidad?.carga_item?.producto?.nombre ||
                    item.unidad_detalle?.carga_item?.producto?.nombre ||
                    "Producto";

                  return {
                    id: item.id,
                    unidad_codigo: codigoBarra,
                    valor_unitario: Number(item.valor_unitario) || 0,
                    producto_nombre: productoNombre,
                    temporal_id: item.id || `existing_${item.id}`,
                  };
                })
                .filter((item) => item.unidad_codigo),
            }
          : initialForm;

      const checkForChanges = () => {
        const formChanged =
          JSON.stringify(form) !== JSON.stringify(initialFormData);
        return formChanged;
      };

      setHasChanges(checkForChanges());
    }
  }, [form, open, isEdit, editing]);

useEffect(() => {
  if (!open) {
    setForm(initialForm);
    setCodigoBarras("");
    setErrorScan("");
    setHasChanges(false);
  }
}, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleClienteChange = (selected) => {
    setForm((prev) => ({
      ...prev,
      cliente: selected ? selected.value : null,
      items_data: [], // Limpiar items al cambiar cliente
    }));
  };

  const handleValorUnitarioChange = (index, value) => {
    const newItems = [...form.items_data];
    newItems[index] = {
      ...newItems[index],
      valor_unitario: Number(value) || 0,
    };
    setForm((prev) => ({ ...prev, items_data: newItems }));
  };

  const handleAgregarPorCodigo = async () => {
    if (!codigoBarras.trim()) {
      setErrorScan("Ingrese un código de barras");
      return;
    }

    if (codigoBarras.trim().length < 3) {
      setErrorScan("El código de barras debe tener al menos 3 caracteres");
      return;
    }

    if (!form.cliente) {
      setErrorScan("Seleccione un cliente primero");
      return;
    }

    // Verificar si el código ya existe
    const existe = form.items_data.some(
      (item) => item.unidad_codigo === codigoBarras
    );

    if (existe) {
      setErrorScan("Este código ya fue agregado");
      return;
    }

    setLoadingValidation(true);
    setErrorScan("");

    try {
      // Validar con el backend
      const validation = await validarUnidadParaEnvio(
        codigoBarras,
        form.cliente
      );

      if (!validation.valida) {
        setErrorScan(validation.error);
        return;
      }

      console.log("DEBUG - Validación exitosa:", validation);

      // Obtener el nombre del producto de manera robusta
      const productoNombre =
        validation.unidad?.carga_item?.producto?.nombre ||
        validation.unidad?.producto_nombre ||
        "Producto";

      const precioReferencia =
        validation.unidad?.carga_item?.producto?.precio_referencia || 0;

      // Si la validación es exitosa, agregar el item
      setForm((prev) => ({
        ...prev,
        items_data: [
          ...prev.items_data,
          {
            unidad_codigo: codigoBarras,
            valor_unitario: precioReferencia,
            temporal_id: Date.now() + Math.random(),
            producto_nombre: productoNombre,
          },
        ],
      }));

      setCodigoBarras("");
      setErrorScan("");
    } catch (err) {
      setErrorScan("Error al validar la unidad. Intente nuevamente.");
      console.error("Error en validación:", err);
    } finally {
      setLoadingValidation(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAgregarPorCodigo();
    }
  };

  const handleRemoverItem = (index) => {
    setForm((prev) => ({
      ...prev,
      items_data: prev.items_data.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.cliente ||
      !form.conductor ||
      !form.placa_vehiculo ||
      !form.origen
    ) {
      setErrorScan("Complete todos los campos obligatorios");
      return;
    }

    // Filtrar items que tengan código de barras válido
    const itemsValidos = form.items_data.filter(
      (item) => item.unidad_codigo && item.unidad_codigo.trim() !== ""
    );

    if (itemsValidos.length === 0) {
      setErrorScan("Debe agregar al menos un item válido con código de barras");
      return;
    }

    // Preparar items para el backend
    const payloadItems = itemsValidos.map((item) => ({
      unidad_codigo: item.unidad_codigo.trim(),
      valor_unitario: item.valor_unitario,
    }));

    const payload = {
      cliente: form.cliente,
      conductor: form.conductor,
      placa_vehiculo: form.placa_vehiculo,
      origen: form.origen,
      items_data: payloadItems,
    };

    try {
      await onSubmit(payload, editing?.id);
      setHasChanges(false);
      onClose();
    } catch (error) {
      console.error("Error al guardar el envío:", error);
      setErrorScan("Error al guardar el envío. Intente nuevamente.");
    }
  };

  const selectedClient = clientOptions.find(
    (opt) => opt.value === form.cliente
  );
  const total = form.items_data.reduce(
    (sum, item) => sum + (item.valor_unitario || 0),
    0
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar envío" : "Crear envío"}
      size="xl"
      preventClose={hasChanges && !enviosLoading}
      closeConfirmationMessage="¿Está seguro que desea salir? Se perderán los cambios no guardados del envío.">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Campos del formulario (igual que antes) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente <span className="text-red-500">*</span>
            </label>
            <Select
              isLoading={loadingClients}
              options={clientOptions}
              value={selectedClient}
              onChange={handleClienteChange}
              placeholder="Seleccione un cliente..."
              isDisabled={isEdit}
              required
            />
          </div>

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
                value={form.conductor}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="Nombre del conductor"
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
                value={form.placa_vehiculo}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="Ej: ABC123"
              />
            </div>
          </div>

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
                value={form.origen}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="Lugar de origen del envío"
              />
            </div>
          </div>
        </div>

        {/* Sección de items */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Agregar items
          </h3>

          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de barras
                  {loadingValidation && (
                    <span className="ml-2 text-blue-600 text-xs">
                      Validando...
                    </span>
                  )}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <RiBarcodeLine className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    value={codigoBarras}
                    onChange={(e) => {
                      setCodigoBarras(e.target.value);
                      setErrorScan("");
                    }}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    placeholder="Escanear código de barras y presionar Enter"
                    disabled={loadingValidation || !form.cliente}
                  />
                </div>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAgregarPorCodigo}
                  disabled={
                    !codigoBarras.trim() || loadingValidation || !form.cliente
                  }
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {loadingValidation ? (
                    <>
                      <RiLoader4Line className="animate-spin" />
                      Validando...
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

            {errorScan && (
              <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                <RiErrorWarningLine />
                {errorScan}
              </div>
            )}
          </div>

          {form.items_data.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Items en el envío:</h4>

              {form.items_data.map((item, index) => {
                const codigo = item.unidad_codigo;

                console.log("DEBUG - Item en lista:", {
                  codigo: codigo,
                  nombre: item.producto_nombre,
                  tieneNombre: !!item.producto_nombre,
                  tieneCodigo: !!codigo,
                });

                return (
                  <div
                    key={item.temporal_id || item.id}
                    className="flex items-center gap-3 p-3 bg-white border rounded-lg">
                    <div className="flex-1">
                      {/* NOMBRE DEL PRODUCTO EN GRANDE */}
                      <p className="font-medium text-gray-900 mb-1">
                        {item.producto_nombre || "Producto"}
                      </p>

                      {/* CÓDIGO DE BARRAS PEQUEÑO */}
                      <p className="font-mono text-xs bg-gray-100 p-1.5 rounded text-gray-600">
                        {codigo || "Código no disponible"}
                      </p>

                      {item.id && !codigo && (
                        <p className="text-xs text-blue-600 mt-1">
                          ⚡ Item existente - necesita actualización
                        </p>
                      )}
                    </div>

                    <div className="w-32">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <RiMoneyDollarCircleLine className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.valor_unitario}
                          onChange={(e) =>
                            handleValorUnitarioChange(index, e.target.value)
                          }
                          className="w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                          placeholder="0.00"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoverItem(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors self-center"
                      title="Remover item">
                      <RiSubtractLine />
                    </button>
                  </div>
                );
              })}

              <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="font-medium text-blue-900">
                  Valor total del envío:
                </span>
                <span className="text-xl font-bold text-blue-900">
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={enviosLoading}>
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviosLoading || form.items_data.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {enviosLoading ? (
              <>
                <RiLoader4Line className="animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <RiSaveLine />
                {isEdit ? "Guardar cambios" : "Crear envío"}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
