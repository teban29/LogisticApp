import { useEffect, useState, useRef } from "react";
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
  RiExpandUpDownLine,
} from "react-icons/ri";

const initialForm = {
  cliente: null,
  conductor: "",
  placa_vehiculo: "",
  origen: "",
  items_data: [],
};

const agruparItems = (items) => {
  const grupos = {};

  items.forEach((item) => {
    // Usar producto_nombre y remesa exactos para agrupar
    const productoNombre = item.producto_nombre || "Producto";
    const remesa = item.remesa || "N/A";

    // Crear una clave única basada en producto y remesa
    const clave = `${productoNombre}-${remesa}`;

    if (!grupos[clave]) {
      grupos[clave] = {
        producto_nombre: productoNombre,
        remesa: remesa,
        cantidad: 0,
        valor_unitario: item.valor_unitario || 0,
        items: [],
      };
    }
    grupos[clave].cantidad += 1;
    grupos[clave].items.push(item);
  });

  return Object.values(grupos);
};

export default function EnvioFormModal({ open, onClose, onSubmit, editing }) {
  const isEdit = Boolean(editing?.id);
  const [form, setForm] = useState(initialForm);
  const [clientOptions, setClientOptions] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [codigoBarras, setCodigoBarras] = useState("");
  const [errorScan, setErrorScan] = useState("");
  const [duplicateError, setDuplicateError] = useState("");
  const [loadingValidation, setLoadingValidation] = useState(false);
  const { loading: enviosLoading } = useEnvios();
  const [hasChanges, setHasChanges] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState(false);
  const [vistaAgrupada, setVistaAgrupada] = useState(true); // Nueva opción para cambiar vista

  // Referencias para controlar el focus
  const inputRef = useRef(null);
  const focusTimeoutRef = useRef(null);

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

      // TRANSFORMACIÓN ROBUSTA - Manejar todas las estructuras posibles
      const itemsTransformados = (editing.items || [])
        .map((item, index) => {

          // ESTRATEGIA 1: Buscar código de barras en múltiples ubicaciones
          let codigoBarra = "";
          const posiblesUbicacionesCodigo = [
            item.unidad_codigo,
            item.unidad_detalle?.codigo_barra,
            item.unidad?.codigo_barra,
            item.codigo_barra,
            item.unidad_detalle?.unidad?.codigo_barra,
          ];

          for (const ubicacion of posiblesUbicacionesCodigo) {
            if (ubicacion && ubicacion.trim() !== "") {
              codigoBarra = ubicacion;
              break;
            }
          }

          // ESTRATEGIA 2: Buscar nombre del producto en múltiples ubicaciones
          let productoNombre = "Producto";
          const posiblesUbicacionesProducto = [
            item.producto_nombre,
            item.unidad_detalle?.producto_nombre,
            item.unidad_detalle?.carga_item?.producto?.nombre,
            item.unidad?.carga_item?.producto?.nombre,
            item.producto?.nombre,
            item.unidad_detalle?.producto?.nombre,
          ];

          for (const ubicacion of posiblesUbicacionesProducto) {
            if (ubicacion && ubicacion.trim() !== "") {
              productoNombre = ubicacion;
              break;
            }
          }

          // ESTRATEGIE 3: Buscar ID de carga (Remesa) en múltiples ubicaciones
          let remesa = "N/A";
          const posiblesUbicacionesRemesa = [
            item.remesa,
            item.unidad_detalle?.carga_id,
            item.unidad?.carga_id,
            item.carga_id,
          ];

          for (const ubicacion of posiblesUbicacionesRemesa) {
            if (ubicacion) {
              remesa = ubicacion;
              break;
            }
          }

          const itemTransformado = {
            id: item.id,
            unidad_codigo: codigoBarra,
            valor_unitario: Number(item.valor_unitario) || 0,
            producto_nombre: productoNombre,
            remesa: remesa,
            temporal_id: item.id || `existing_${index}_${Date.now()}`,
          };

          return itemTransformado;
        })
        .filter(
          (item) => item.unidad_codigo && item.unidad_codigo.trim() !== ""
        );


      setForm({
        cliente: editing.cliente?.id || editing.cliente,
        conductor: editing.conductor || "",
        placa_vehiculo: editing.placa_vehiculo || "",
        origen: editing.origen || "",
        items_data: itemsTransformados,
      });
    } else {
      setForm(initialForm);
    }
    setCodigoBarras("");
    setErrorScan("");
    setDuplicateError("");
  }, [editing, open, isEdit]);

  useEffect(() => {
    if (open) {
      const initialFormData =
        isEdit && editing
          ? {
              cliente: editing.cliente?.id || editing.cliente,
              conductor: editing.conductor || "",
              placa_vehiculo: editing.placa_vehiculo || "",
              origen: editing.origen || "",
              items_data: (editing.items || [])
                .map((item) => {
                  // Misma lógica de transformación que arriba
                  const codigoBarra =
                    item.unidad_codigo ||
                    item.unidad_detalle?.codigo_barra ||
                    item.unidad?.codigo_barra ||
                    "";

                  const productoNombre =
                    item.producto_nombre ||
                    item.unidad_detalle?.producto_nombre ||
                    item.unidad_detalle?.carga_item?.producto?.nombre ||
                    item.unidad?.carga_item?.producto?.nombre ||
                    "Producto";

                  const remesa =
                    item.unidad_detalle?.carga_id ||
                    item.unidad?.carga_id ||
                    "N/A";

                  return {
                    id: item.id,
                    unidad_codigo: codigoBarra,
                    valor_unitario: Number(item.valor_unitario) || 0,
                    producto_nombre: productoNombre,
                    remesa: remesa,
                    temporal_id: item.id || `existing_${item.id}`,
                  };
                })
                .filter(
                  (item) =>
                    item.unidad_codigo && item.unidad_codigo.trim() !== ""
                ),
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
      setDuplicateError("");
      setHasChanges(false);
      setRecentlyAdded(false);
      setVistaAgrupada(true); // Resetear a vista agrupada
    }
  }, [open]);

  // Efecto para enfocar el input cuando se abre el modal
  useEffect(() => {
    if (open && inputRef.current) {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
      focusTimeoutRef.current = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }

    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
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

  const handleValorUnitarioGrupoChange = (grupoIndex, valorUnitario) => {
    const grupos = agruparItems(form.items_data);

    if (grupoIndex < 0 || grupoIndex >= grupos.length) return;

    const grupo = grupos[grupoIndex];
    const nuevoValor = Number(valorUnitario) || 0;


    // Actualizar todos los items del grupo
    const nuevosItems = [...form.items_data];

    grupo.items.forEach((itemDelGrupo) => {
      // Buscar el índice exacto en el array principal
      const indexPrincipal = nuevosItems.findIndex(
        (item) =>
          item.temporal_id === itemDelGrupo.temporal_id ||
          item.unidad_codigo === itemDelGrupo.unidad_codigo
      );

      if (indexPrincipal !== -1) {
        nuevosItems[indexPrincipal] = {
          ...nuevosItems[indexPrincipal],
          valor_unitario: nuevoValor,
        };

      }
    });

    // Forzar re-render con un nuevo array
    setForm((prev) => ({
      ...prev,
      items_data: [...nuevosItems],
    }));

  };

  const validarItemsAntesDeEnviar = () => {
    const itemsConValorCero = form.items_data.filter(
      (item) => !item.valor_unitario || item.valor_unitario === 0
    );

    const total = form.items_data.reduce(
      (sum, item) => sum + (Number(item.valor_unitario) || 0),
      0
    );

    return total > 0;
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
      setDuplicateError("Este código ya fue agregado");
      setTimeout(() => setDuplicateError(""), 3000);
      setCodigoBarras("");
      if (inputRef.current) {
        inputRef.current.focus();
      }
      return;
    }

    setLoadingValidation(true);
    setErrorScan("");
    setDuplicateError("");

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


      // Obtener el nombre del producto de manera robusta
      const productoNombre =
        validation.unidad?.producto_nombre ||
        validation.unidad?.carga_item?.producto?.nombre ||
        "Producto";

      // OBTENER ID DE CARGA (REMESA)
      let remesa = "N/A";

      if (validation.unidad?.carga_id) {
        remesa = validation.unidad.carga_id;
      }


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
            producto_nombre: productoNombre,
            remesa: remesa,
            temporal_id: Date.now() + Math.random(),
          },
        ],
      }));

      setCodigoBarras("");
      setErrorScan("");
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
      setErrorScan("Error al validar la unidad. Intente nuevamente.");
      console.error("Error en validación:", err.message);
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

    // Mantener el foco en el input principal
    if (inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 10);
    }
  };

  const handleRemoverGrupo = (grupoIndex) => {
    const grupos = agruparItems(form.items_data);
    const grupo = grupos[grupoIndex];

    // Remover todos los items del grupo
    const nuevosItems = form.items_data.filter(
      (item) =>
        !(
          item.producto_nombre === grupo.producto_nombre &&
          item.remesa === grupo.remesa
        )
    );

    setForm((prev) => ({ ...prev, items_data: nuevosItems }));

    // Mantener el foco en el input principal
    if (inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 10);
    }
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

    // Validar items antes de enviar
    if (!validarItemsAntesDeEnviar()) {
      setErrorScan("Verifique los valores unitarios de los items");
      return;
    }

    // **CORRECCIÓN IMPORTANTE:** Asegurar que todos los valores sean números válidos
    const payloadItems = itemsValidos.map((item) => {
      // Asegurar que valor_unitario sea un número válido
      const valorUnitario = Number(item.valor_unitario);

      return {
        unidad_codigo: item.unidad_codigo.trim(),
        valor_unitario:
          !isNaN(valorUnitario) && isFinite(valorUnitario) ? valorUnitario : 0,
      };
    });

    // **NUEVO: DEBUG - Verificar qué se está enviando**
    console.log("DEBUG - Payload items enviados:", payloadItems);
    console.log(
      "DEBUG - Valor total calculado:",
      payloadItems.reduce((sum, item) => sum + item.valor_unitario, 0)
    );

    const payload = {
      cliente: form.cliente,
      conductor: form.conductor,
      placa_vehiculo: form.placa_vehiculo,
      origen: form.origen,
      items_data: payloadItems,
    };

    // **NUEVO: Agregar una confirmación visual antes de enviar**
    console.log(
      "DEBUG - Enviando payload completo:",
      JSON.stringify(payload, null, 2)
    );

    try {
      await onSubmit(payload, editing?.id);
      setHasChanges(false);
      onClose();
    } catch (error) {
      console.error("Error al guardar el envío:", error);

      // **MEJORA: Mostrar errores específicos del backend**
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Error al guardar el envío. Intente nuevamente.";

      setErrorScan(errorMessage);
    }
  };

  const selectedClient = clientOptions.find(
    (opt) => opt.value === form.cliente // ← Buscar por ID, no por objeto
  );
  const total = form.items_data.reduce(
    (sum, item) => sum + (Number(item.valor_unitario) || 0),
    0
  );

  const grupos = agruparItems(form.items_data);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar envío" : "Crear envío"}
      size="xl"
      preventClose={hasChanges && !enviosLoading}
      closeConfirmationMessage="¿Está seguro que desea salir? Se perderán los cambios no guardados del envío.">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Campos del formulario */}
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
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Agregar items</h3>

            {form.items_data.length > 0 && (
              <button
                type="button"
                onClick={() => setVistaAgrupada(!vistaAgrupada)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                <RiExpandUpDownLine />
                {vistaAgrupada ? "Vista individual" : "Vista agrupada"}
              </button>
            )}
          </div>

          {/* Indicador de cambios no guardados */}
          {hasChanges && (
            <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <div className="flex items-center gap-2 text-yellow-700 text-sm">
                <RiErrorWarningLine />
                <span>Tiene cambios sin guardar en los items</span>
              </div>
            </div>
          )}

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
                    ref={inputRef}
                    value={codigoBarras}
                    onChange={(e) => {
                      setCodigoBarras(e.target.value);
                      setErrorScan("");
                      setDuplicateError("");
                    }}
                    onKeyPress={handleKeyPress}
                    className={`w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                      recentlyAdded ? "ring-2 ring-green-500" : ""
                    }`}
                    placeholder="Escanear código de barras y presionar Enter"
                    disabled={loadingValidation || !form.cliente}
                  />
                </div>
                {duplicateError && (
                  <span className="text-red-500 text-xs mt-1 block animate-pulse">
                    {duplicateError}
                  </span>
                )}
                {errorScan && (
                  <span className="text-red-500 text-xs mt-1 block">
                    {errorScan}
                  </span>
                )}
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
          </div>

          {form.items_data.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">
                {vistaAgrupada ? "Items agrupados:" : "Items individuales:"}
              </h4>

              {vistaAgrupada
                ? /* VISTA AGRUPADA */
                  grupos.map((grupo, grupoIndex) => (
                    <div
                      key={grupoIndex}
                      className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                      {/* Header del grupo */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h5 className="font-semibold text-gray-900 text-lg">
                            {grupo.producto_nombre} × {grupo.cantidad}
                          </h5>
                          <p className="text-sm text-gray-600 mt-1">
                            Remesa:{" "}
                            <span className="font-mono">{grupo.remesa}</span>
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            Valor unitario:{" "}
                            <span className="font-semibold">
                              ${grupo.valor_unitario.toFixed(2)}
                            </span>
                          </p>
                          <p className="text-sm text-green-600 font-semibold mt-1">
                            Total grupo: $
                            {(grupo.cantidad * grupo.valor_unitario).toFixed(2)}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          {/* Input para editar valor unitario del grupo */}
                          <div className="w-32">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Valor unitario
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                <RiMoneyDollarCircleLine className="h-3 w-3 text-gray-400" />
                              </div>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={grupo.valor_unitario}
                                onChange={(e) =>
                                  handleValorUnitarioGrupoChange(
                                    grupoIndex,
                                    e.target.value
                                  )
                                }
                                className="w-full pl-6 pr-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                placeholder="0.00"
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoverGrupo(grupoIndex)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors self-end"
                            title="Remover todo el grupo">
                            <RiSubtractLine />
                          </button>
                        </div>
                      </div>

                      {/* Lista de códigos de barras del grupo (colapsable) */}
                      <details className="mt-2 border-t pt-2">
                        <summary className="text-sm text-blue-600 cursor-pointer hover:text-blue-800 flex items-center gap-1">
                          <RiExpandUpDownLine className="h-3 w-3" />
                          Ver {grupo.cantidad} código(s) de barras individuales
                        </summary>
                        <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                          {grupo.items.map((item, itemIndex) => {
                            const itemIndexGlobal = form.items_data.findIndex(
                              (i) =>
                                i.temporal_id === item.temporal_id ||
                                i.unidad_codigo === item.unidad_codigo
                            );

                            return (
                              <div
                                key={itemIndex}
                                className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded border">
                                <span className="font-mono bg-white px-2 py-1 rounded border">
                                  {item.unidad_codigo}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoverItem(itemIndexGlobal)
                                  }
                                  className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                                  title="Remover item individual">
                                  <RiSubtractLine className="h-3 w-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </details>
                    </div>
                  ))
                : /* VISTA INDIVIDUAL (original) */
                  form.items_data.map((item, index) => {
                    const codigo = item.unidad_codigo;

                    return (
                      <div
                        key={item.temporal_id || item.id}
                        className="flex items-center gap-3 p-3 bg-white border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 mb-1">
                            {item.producto_nombre || "Producto"}
                          </p>
                          <p className="text-xs text-gray-500">
                            Rem: {item.remision || "N/A"}
                          </p>
                          <p className="font-mono text-xs bg-gray-100 p-1.5 rounded text-gray-600 mt-1">
                            {codigo || "Código no disponible"}
                          </p>
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

              {/* Total */}
              <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="font-medium text-blue-900">
                  Valor total del envío:
                </span>
                <span className="text-xl font-bold text-blue-900">
                  ${total.toFixed(2)}
                </span>
              </div>

              {/* Resumen de grupos */}
              {vistaAgrupada && grupos.length > 1 && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">
                    Resumen: {grupos.length} tipo(s) de producto,{" "}
                    {form.items_data.length} unidad(es) totales
                  </p>
                </div>
              )}
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
