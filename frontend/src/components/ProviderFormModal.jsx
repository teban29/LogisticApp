import { useState, useEffect } from "react";
import Modal from "./Modal";
import {
  RiBuildingLine,
  RiIdCardLine,
  RiMailLine,
  RiPhoneLine,
  RiMapPinLine,
  RiRoadMapLine,
  RiCheckboxCircleLine,
  RiCloseLine,
  RiSaveLine,
  RiLoader4Line,
} from "react-icons/ri";

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
  const [hasChanges, setHasChanges] = useState(false);

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
  }, [editing, open, isEdit]);

  // Detectar cambios en el formulario
  useEffect(() => {
    if (open) {
      const initialForm = isEdit
        ? {
            nombre: editing.nombre || "",
            nit: editing.nit || "",
            email: editing.email || "",
            telefono: editing.telefono || "",
            ciudad: editing.ciudad || "",
            direccion: editing.direccion || "",
            is_active: editing.is_active ?? true,
          }
        : initial;

      const checkForChanges = () => {
        return JSON.stringify(form) !== JSON.stringify(initialForm);
      };

      setHasChanges(checkForChanges());
    }
  }, [form, open, isEdit, editing]);

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
      setError(
        "Error al guardar el proveedor. Por favor, verifique los datos e intente nuevamente."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar proveedor" : "Crear proveedor"}
      size="md"
      preventClose={hasChanges && !saving}
      closeConfirmationMessage="¿Está seguro que desea salir? Se perderán los cambios no guardados del proveedor.">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
          <RiCloseLine className="text-lg mr-2 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <RiBuildingLine className="h-5 w-5 text-gray-400" />
              </div>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="Nombre del proveedor"
              />
            </div>
          </div>

          {/* NIT */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              NIT
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <RiIdCardLine className="h-5 w-5 text-gray-400" />
              </div>
              <input
                name="nit"
                value={form.nit}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="Número de identificación tributaria"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <RiMailLine className="h-5 w-5 text-gray-400" />
              </div>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                type="email"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="correo@proveedor.com"
              />
            </div>
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <RiPhoneLine className="h-5 w-5 text-gray-400" />
              </div>
              <input
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="Número de contacto"
              />
            </div>
          </div>

          {/* Dirección */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <RiRoadMapLine className="h-5 w-5 text-gray-400" />
              </div>
              <input
                name="direccion"
                value={form.direccion}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="Dirección completa"
              />
            </div>
          </div>

          {/* Ciudad */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ciudad
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <RiMapPinLine className="h-5 w-5 text-gray-400" />
              </div>
              <input
                name="ciudad"
                value={form.ciudad}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                placeholder="Ciudad del proveedor"
              />
            </div>
          </div>

          {/* Estado activo */}
          <div className="md:col-span-2">
            <label className="inline-flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div
                  className={`w-10 h-6 rounded-full transition-colors ${
                    form.is_active ? "bg-blue-600" : "bg-gray-300"
                  }`}>
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      form.is_active ? "transform translate-x-4" : ""
                    }`}></div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {form.is_active ? (
                  <RiCheckboxCircleLine className="text-green-600" />
                ) : (
                  <RiCloseLine className="text-gray-400" />
                )}
                <span className="text-sm font-medium text-gray-700">
                  Proveedor activo
                </span>
              </div>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-16">
              Los proveedores inactivos no estarán disponibles para asignar a
              clientes
            </p>
          </div>
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
                {isEdit ? "Guardar cambios" : "Crear proveedor"}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
