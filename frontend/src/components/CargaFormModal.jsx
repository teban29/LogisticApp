import { useEffect, useState } from "react";
import Modal from "./Modal";
import { listProviders, listClients } from "../api/partners";
import {
  RiUserLine,
  RiTruckLine,
  RiFileTextLine,
  RiFileListLine,
  RiAddLine,
  RiCloseLine,
  RiSaveLine,
  RiLoader4Line,
  RiInformationLine,
  RiBox3Line,
  RiNumbersLine,
  RiCheckboxCircleLine,
} from "react-icons/ri";

export default function CargaFormModal({
  open,
  onClose,
  onSubmit,
  editing = null,
}) {
  const [form, setForm] = useState({
    cliente: "",
    proveedor: "",
    remision: "",
    observaciones: "",
    facturaFile: null,
    auto_generar_unidades: true,
  });

  const [items, setItems] = useState([
    { producto_nombre: "", producto_sku: "", cantidad: 1 },
  ]);

  const [clientesOptions, setClientesOptions] = useState([]);
  const [proveedoresOptions, setProveedoresOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [hasChanges, setHasChanges] = useState(false); // ← Nuevo estado

  // Cargar clientes cuando se abre el modal
  useEffect(() => {
    if (!open) return;
    let mounted = true;
    const fetchClients = async () => {
      setLoadingOptions(true);
      try {
        const cData = await (listClients
          ? listClients({ page: 1 })
          : Promise.resolve({ results: [] }));
        const clientsList = cData?.results || cData || [];
        if (!mounted) return;
        setClientesOptions(
          clientsList.map((c) => ({ value: c.id, label: c.nombre }))
        );
      } catch (err) {
        console.error("Error fetching clients:", err);
        if (mounted) setClientesOptions([]);
      } finally {
        if (mounted) setLoadingOptions(false);
      }
    };
    fetchClients();
    return () => {
      mounted = false;
    };
  }, [open]);

  // Cuando cambia el cliente, cargar proveedores asignados a ese cliente
  useEffect(() => {
    let mounted = true;
    const loadProvidersForClient = async () => {
      if (!form.cliente) {
        if (mounted) {
          setProveedoresOptions([]);
          setForm((f) => ({ ...f, proveedor: "" }));
        }
        return;
      }
      setLoadingOptions(true);
      try {
        const pData = await listProviders({
          cliente_id: form.cliente,
          page: 1,
        });
        const provList = pData?.results || pData || [];
        if (!mounted) return;
        setProveedoresOptions(
          provList.map((p) => ({
            value: p.id,
            label: `${p.nombre} — ${p.nit || ""}`,
          }))
        );
        if (!provList.some((p) => String(p.id) === String(form.proveedor))) {
          setForm((f) => ({ ...f, proveedor: "" }));
        }
      } catch (err) {
        console.error("Error fetching providers for client:", err);
        if (mounted) {
          setProveedoresOptions([]);
          setForm((f) => ({ ...f, proveedor: "" }));
        }
      } finally {
        if (mounted) setLoadingOptions(false);
      }
    };
    loadProvidersForClient();
    return () => {
      mounted = false;
    };
  }, [form.cliente]);

  // Resetear formulario cuando se cierra
  useEffect(() => {
    if (!open) {
      setForm({
        cliente: "",
        proveedor: "",
        remision: "",
        observaciones: "",
        facturaFile: null,
        auto_generar_unidades: true,
      });
      setItems([{ producto_nombre: "", producto_sku: "", cantidad: 1 }]);
      setError("");
      setProveedoresOptions([]);
      setHasChanges(false); // ← Resetear cambios al cerrar
    }
  }, [open]);

  // precargar cuando editing cambia
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        cliente: editing.cliente || "",
        proveedor: editing.proveedor || "",
        remision: editing.remision || "",
        observaciones: editing.observaciones || "",
        facturaFile: null,
        auto_generar_unidades: true,
      });
      setItems(
        (editing.items || []).map((it) => ({
          producto_nombre: it.producto?.nombre || "",
          producto_sku: it.producto?.sku || "",
          cantidad: it.cantidad || 1,
        }))
      );
    } else {
      setForm({
        cliente: "",
        proveedor: "",
        remision: "",
        observaciones: "",
        facturaFile: null,
        auto_generar_unidades: true,
      });
      setItems([{ producto_nombre: "", producto_sku: "", cantidad: 1 }]);
    }
  }, [editing, open]);

  // ← Nuevo useEffect para detectar cambios
  useEffect(() => {
    if (open) {
      const initialForm = editing
        ? {
            cliente: editing.cliente || "",
            proveedor: editing.proveedor || "",
            remision: editing.remision || "",
            observaciones: editing.observaciones || "",
            facturaFile: null,
            auto_generar_unidades: true,
          }
        : {
            cliente: "",
            proveedor: "",
            remision: "",
            observaciones: "",
            facturaFile: null,
            auto_generar_unidades: true,
          };

      const initialItems = editing
        ? (editing.items || []).map((it) => ({
            producto_nombre: it.producto?.nombre || "",
            producto_sku: it.producto?.sku || "",
            cantidad: it.cantidad || 1,
          }))
        : [{ producto_nombre: "", producto_sku: "", cantidad: 1 }];

      const checkForChanges = () => {
        const formChanged =
          JSON.stringify(form) !== JSON.stringify(initialForm);
        const itemsChanged =
          JSON.stringify(items) !== JSON.stringify(initialItems);
        return formChanged || itemsChanged;
      };

      setHasChanges(checkForChanges());
    }
  }, [form, items, open, editing]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (name === "factura") {
      setForm((f) => ({ ...f, facturaFile: files?.[0] || null }));
    } else if (type === "checkbox") {
      setForm((f) => ({ ...f, [name]: checked }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { producto_nombre: "", producto_sku: "", cantidad: 1 },
    ]);

  const removeItem = (i) =>
    setItems((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setError("");
    setSaving(true);

    // Validaciones
    if (!form.cliente) {
      setError("Selecciona un cliente");
      setSaving(false);
      return;
    }
    if (!form.proveedor) {
      setError("Selecciona un proveedor");
      setSaving(false);
      return;
    }
    if (!form.remision || String(form.remision).trim() === "") {
      setError("Ingresa la remisión");
      setSaving(false);
      return;
    }
    if (!items.length) {
      setError("Añade al menos 1 item");
      setSaving(false);
      return;
    }
    for (const it of items) {
      if (!it.producto_nombre || !it.cantidad || Number(it.cantidad) <= 0) {
        setError("Cada item requiere nombre de producto y cantidad > 0");
        setSaving(false);
        return;
      }
    }

    const payload = {
      cliente: Number(form.cliente),
      proveedor: Number(form.proveedor),
      remision: form.remision,
      observaciones: form.observaciones,
      auto_generar_unidades: !!form.auto_generar_unidades,
      items: items.map((it) => ({
        producto_nombre: it.producto_nombre,
        producto_sku: it.producto_sku || undefined,
        cantidad: Number(it.cantidad),
      })),
      facturaFile: form.facturaFile,
    };

    try {
      await onSubmit(payload, editing?.id || null);
      onClose();
    } catch (err) {
      console.error(err);
      const serverData = err?.response?.data;
      let message =
        "Error al guardar la carga. Por favor, verifique los datos.";
      if (serverData) {
        if (serverData.detail) message = serverData.detail;
        else if (typeof serverData === "string") message = serverData;
        else if (typeof serverData === "object")
          message = JSON.stringify(serverData);
      }
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Editar carga" : "Crear carga"}
      size="lg"
      preventClose={hasChanges && !saving} // ← Nueva prop
      closeConfirmationMessage="¿Está seguro que desea salir? Se perderán los cambios no guardados de la carga." // ← Nueva prop
    >
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
          <RiCloseLine className="text-lg mr-2 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cliente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cliente <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <RiUserLine className="h-5 w-5 text-gray-400" />
              </div>
              <select
                name="cliente"
                value={form.cliente}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                required
                disabled={loadingOptions}>
                <option value="">Selecciona un cliente</option>
                {clientesOptions.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Proveedor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proveedor <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <RiTruckLine className="h-5 w-5 text-gray-400" />
              </div>
              <select
                name="proveedor"
                value={form.proveedor}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                required
                disabled={!form.cliente || loadingOptions}>
                <option value="">
                  {form.cliente
                    ? "Selecciona un proveedor"
                    : "Primero selecciona un cliente"}
                </option>
                {proveedoresOptions.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            {!form.cliente && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <RiInformationLine className="flex-shrink-0" />
                Selecciona un cliente para ver sus proveedores
              </p>
            )}
          </div>

          {/* Remisión */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Remisión <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <RiFileTextLine className="h-5 w-5 text-gray-400" />
              </div>
              <input
                name="remision"
                value={form.remision}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                required
                placeholder="Número de remisión"
              />
            </div>
          </div>

          {/* Factura */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Factura (PDF/PNG/JPG)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <RiFileListLine className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="file"
                name="factura"
                accept=".pdf,image/*"
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          </div>

          {/* Observaciones */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observaciones
            </label>
            <textarea
              name="observaciones"
              value={form.observaciones}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              rows={3}
              placeholder="Observaciones adicionales sobre la carga..."
            />
          </div>
        </div>

        {/* Items */}
        <div className="border-t pt-4">
          <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <RiBox3Line />
            Items de la carga <span className="text-red-500">*</span>
          </h3>

          <div className="space-y-3">
            {items.map((it, idx) => (
              <div
                key={idx}
                className="p-4 border border-gray-200 rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                  {/* Nombre del producto */}
                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Producto <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <RiBox3Line className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        value={it.producto_nombre}
                        onChange={(e) =>
                          handleItemChange(
                            idx,
                            "producto_nombre",
                            e.target.value
                          )
                        }
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                        placeholder="Nombre del producto"
                        required
                      />
                    </div>
                  </div>

                  {/* SKU (opcional) */}
                  <div className="md:col-span-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      SKU (opcional)
                    </label>
                    <input
                      value={it.producto_sku}
                      onChange={(e) =>
                        handleItemChange(idx, "producto_sku", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                      placeholder="Código SKU"
                    />
                  </div>

                  {/* Cantidad */}
                  <div className="md:col-span-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Cantidad <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <RiNumbersLine className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        min={1}
                        value={it.cantidad}
                        onChange={(e) =>
                          handleItemChange(
                            idx,
                            "cantidad",
                            Number(e.target.value)
                          )
                        }
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                        required
                      />
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar item">
                      <RiCloseLine className="text-lg" />
                    </button>
                    {idx === items.length - 1 && (
                      <button
                        type="button"
                        onClick={addItem}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Agregar otro item">
                        <RiAddLine className="text-lg" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addItem}
            className="mt-3 flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors">
            <RiAddLine />
            Agregar otro item
          </button>
        </div>

        {/* Auto-generar unidades */}
        <div className="border-t pt-4">
          <label className="inline-flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                name="auto_generar_unidades"
                checked={form.auto_generar_unidades}
                onChange={handleChange}
                className="sr-only"
              />
              <div
                className={`w-10 h-6 rounded-full transition-colors ${
                  form.auto_generar_unidades ? "bg-blue-600" : "bg-gray-300"
                }`}>
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    form.auto_generar_unidades ? "transform translate-x-4" : ""
                  }`}></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {form.auto_generar_unidades ? (
                <RiCheckboxCircleLine className="text-green-600" />
              ) : (
                <RiCloseLine className="text-gray-400" />
              )}
              <span className="text-sm font-medium text-gray-700">
                Generar unidades automáticamente
              </span>
            </div>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-16">
            Genera códigos únicos para cada unidad de producto automáticamente
          </p>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            disabled={saving}>
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? (
              <>
                <RiLoader4Line className="animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <RiSaveLine />
                {editing ? "Actualizar carga" : "Crear carga"}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
