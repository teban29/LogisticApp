import { useState, useEffect } from "react";
import Modal from "./Modal";

const initial = {
  nombre: "",
  nit: "",
  email: "",
  telefono: "",
  ciudad: "",
  direccion: "",
  is_active: true,
};

export default function ProviderFormModal({
  open,
  onClose,
  onSubmit,
  editing,
}) {
  const isEdit = Boolean(editing?.id);
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEdit) {
      setForm({
        nombre: editing.nombre || "",
        nit: editing.nit || "",
        email: editing.email || "",
        telefono: editing.telefono || "",
        ciudad: editing.ciudad || "",
        direccion: editing.direccion || "",
        is_active: editing.is_active ?? true,
      });
    } else {
      setForm(initial);
    }
  }, [editing, open]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError("Error al guardar, revisa los datos");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar proveedor" : "Crear proveedor"}>
      {error && (
        <div className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded-md">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Nombre</label>
            <input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
              className="w-full border rounded-lg p-2"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">NIT</label>
            <input
              name="nit"
              value={form.nit}
              onChange={handleChange}
              required
              className="w-full border rounded-lg p-2"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              type="email"
              className="w-full border rounded-lg p-2"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Teléfono</label>
            <input
              name="telefono"
              value={form.telefono}
              onChange={handleChange}
              className="w-full border rounded-lg p-2"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm mb-1">Dirección</label>
            <input
              name="direccion"
              value={form.direccion}
              onChange={handleChange}
              className="w-full border rounded-lg p-2"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Ciudad</label>
            <input
              name="ciudad"
              value={form.ciudad}
              onChange={handleChange}
              className="w-full border rounded-lg p-2"
            />
          </div>
          <label className="inline-flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              name="is_active"
              checked={form.is_active}
              onChange={handleChange}
            />
            <span className="text-sm">Activo</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 border rounded-xl">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-black text-white">
            {saving
              ? "Guardando…"
              : isEdit
              ? "Guardar cambios"
              : "Crear proveedor"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
