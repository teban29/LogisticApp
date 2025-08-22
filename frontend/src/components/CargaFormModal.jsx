// src/components/CargaFormModal.jsx
import { useEffect, useState } from "react";
import Modal from "./Modal";
import { listProviders, listClients } from "../api/partners";

export default function CargaFormModal({ open, onClose, onSubmit }) {
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

  // Cargar clientes cuando se abre el modal
  useEffect(() => {
    if (!open) return;
    let mounted = true;
    const fetchClients = async () => {
      setLoadingOptions(true);
      try {
        const cData = await (listClients ? listClients({ page: 1 }) : Promise.resolve({ results: [] }));
        const clientsList = cData?.results || cData || [];
        if (!mounted) return;
        setClientesOptions(clientsList.map((c) => ({ value: c.id, label: c.nombre })));
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
    }
  }, [open]);

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
    setItems((prev) => [...prev, { producto_nombre: "", producto_sku: "", cantidad: 1 }]);
  const removeItem = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    // Validaciones cliente/proveedor/remision/items
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
      await onSubmit(payload);
      onClose();
    } catch (err) {
      console.error("Error creando carga - axios error:", err);
      console.error("err.response:", err?.response);
      console.error("err.response.data:", err?.response?.data);
      const serverData = err?.response?.data;
      let message = "Error al crear la carga";
      if (serverData) {
        if (serverData.detail) message = serverData.detail;
        else message = JSON.stringify(serverData);
      }
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} isOpen={open} show={open} onClose={onClose} title="Crear carga">
      {/* Contenedor con max-height y scroll */}
      <div className="max-h-[80vh] overflow-y-auto overflow-x-hidden pr-4">
        <div className="space-y-4 pb-24">
          {error && (
            <div className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">Cliente</label>
                <select
                  name="cliente"
                  value={form.cliente}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2"
                  required
                  disabled={loadingOptions}
                >
                  <option value="">Selecciona cliente</option>
                  {clientesOptions.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Proveedor asignado</label>
                <select
                  name="proveedor"
                  value={form.proveedor}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2"
                  required
                  disabled={!form.cliente || loadingOptions}
                >
                  <option value="">
                    {form.cliente ? "Selecciona proveedor" : "Elige primero un cliente"}
                  </option>
                  {proveedoresOptions.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Remisión</label>
                <input
                  name="remision"
                  value={form.remision}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Factura (PDF/PNG/JPG)</label>
                <input
                  type="file"
                  name="factura"
                  accept=".pdf,image/*"
                  onChange={handleChange}
                  className="w-full"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm mb-1">Observaciones</label>
                <textarea
                  name="observaciones"
                  value={form.observaciones}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-2"
                  rows={2}
                />
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Items (producto y cantidad)</h3>
              <div className="space-y-2">
                {items.map((it, idx) => (
                  <div key={idx} className="grid md:grid-cols-6 gap-2 items-end">
                    <div className="md:col-span-3">
                      <label className="block text-xs mb-1">Producto (nombre)</label>
                      <input
                        value={it.producto_nombre}
                        onChange={(e) => handleItemChange(idx, "producto_nombre", e.target.value)}
                        className="w-full border rounded-lg p-2"
                        placeholder="Ej: Tambor 200L"
                      />
                    </div>

                    <div>
                      <label className="block text-xs mb-1">Cantidad</label>
                      <input
                        type="number"
                        min={1}
                        value={it.cantidad}
                        onChange={(e) => handleItemChange(idx, "cantidad", Number(e.target.value))}
                        className="w-full border rounded-lg p-2"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button type="button" onClick={() => removeItem(idx)} className="px-3 py-1 border rounded-xl">Eliminar</button>
                      {idx === items.length - 1 && <button type="button" onClick={addItem} className="px-2 py-1 border rounded-xl">Agregar</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" name="auto_generar_unidades" checked={form.auto_generar_unidades} onChange={handleChange} />
                <span className="text-sm">Generar unidades (códigos) automáticamente</span>
              </label>
            </div>
          </form>
        </div>
      </div>

      {/* Footer sticky con botones */}
      <div className="sticky bottom-0 left-0 right-0 bg-white py-3 px-4 border-t shadow-sm flex justify-end gap-2 z-50">
        <button type="button" onClick={onClose} className="px-3 py-2 border rounded-xl">Cancelar</button>
        <button type="button" onClick={handleSubmit} disabled={saving} className="px-4 py-2 rounded-xl bg-black text-white">{saving ? "Creando…" : "Crear carga"}</button>
      </div>
    </Modal>
  );
}
