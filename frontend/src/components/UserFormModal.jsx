import { useEffect, useState } from "react";
import Modal from "./Modal";

const initial = {
  username: "",
  nombre: "",
  apellido: "",
  rol: "",
  password: "",
  is_active: true,
};

export default function UserFormModal({
  open,
  onClose,
  onSubmit,
  editingUser,
}) {
  const [form, setForm] = useState(initial);
  const isEdit = Boolean(editingUser?.id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEdit) {
      setForm({
        username: editingUser.username || "",
        nombre: editingUser.nombre || "",
        apellido: editingUser.apellido || "",
        rol: editingUser.rol || "",
        password: "",
        is_active: editingUser.is_active ?? true,
      });
    } else {
      setForm(initial);
    }
  }, [editingUser, open, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = { ...form };
      if (isEdit && !payload.password) delete payload.password;
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError("No se pudo guardar, verifica los datos");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar usuario" : "Crear usuario"}>
      {error && (
        <div className="mb-3 text-sm text-red-600 bg-red-50 p-2 rounded-md">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Usuario</label>
            <input
              className="w-full border rounded-lg p-2"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              disabled={isEdit} // no permitir cambiar username en edición
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Rol</label>
            <select
              className="w-full border rounded-lg p-2"
              name="rol"
              value={form.rol}
              onChange={handleChange}>
              <option value="admin">Administrador</option>
              <option value="admin">Conductor</option>
              <option value="operador">Operador</option>
              <option value="cliente">Cliente</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Nombre</label>
            <input
              className="w-full border rounded-lg p-2"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Apellido</label>
            <input
              className="w-full border rounded-lg p-2"
              name="apellido"
              value={form.apellido}
              onChange={handleChange}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm mb-1">
              {isEdit ? "Nueva contraseña (opcional)" : "Contraseña"}
            </label>
            <input
              type="password"
              className="w-full border rounded-lg p-2"
              name="password"
              value={form.password}
              onChange={handleChange}
              required={!isEdit}
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
              : "Crear usuario"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
