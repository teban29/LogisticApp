import { useEffect, useState } from "react";
import Modal from "./Modal";
import {
  RiUserLine,
  RiUserSettingsLine,
  RiShieldUserLine,
  RiUserStarLine,
  RiUserFollowLine,
  RiLockPasswordLine,
  RiCheckboxCircleLine,
  RiCloseLine,
  RiSaveLine,
  RiLoader4Line,
  RiInformationLine,
} from "react-icons/ri";

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
      setError(
        "No se pudo guardar el usuario. Por favor, verifique los datos e intente nuevamente."
      );
    } finally {
      setSaving(false);
    }
  };

  // Iconos para diferentes roles
  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return <RiShieldUserLine className="text-purple-600" />;
      case "conductor":
        return <RiUserSettingsLine className="text-orange-600" />;
      case "operador":
        return <RiUserSettingsLine className="text-blue-600" />;
      case "cliente":
        return <RiUserLine className="text-green-600" />;
      default:
        return <RiUserLine className="text-gray-600" />;
    }
  };

  // Configuración para cada rol
  const getRoleConfig = (role) => {
    switch (role) {
      case "admin":
        return {
          color: "text-purple-700",
          bg: "bg-purple-100",
          label: "Administrador",
        };
      case "conductor":
        return {
          color: "text-orange-700",
          bg: "bg-orange-100",
          label: "Conductor",
        };
      case "operador":
        return { color: "text-blue-700", bg: "bg-blue-100", label: "Operador" };
      case "cliente":
        return {
          color: "text-green-700",
          bg: "bg-green-100",
          label: "Cliente",
        };
      default:
        return { color: "text-gray-700", bg: "bg-gray-100", label: role };
    }
  };

  const roleOptions = [
    { value: "admin", label: "Administrador", icon: <RiShieldUserLine /> },
    { value: "conductor", label: "Conductor", icon: <RiUserSettingsLine /> },
    { value: "operador", label: "Operador", icon: <RiUserSettingsLine /> },
    { value: "cliente", label: "Cliente", icon: <RiUserLine /> },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar usuario" : "Crear usuario"}
      size="md">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
          <RiCloseLine className="text-lg mr-2 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Usuario */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usuario <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <RiUserStarLine className="h-5 w-5 text-gray-400" />
              </div>
              <input
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                name="username"
                value={form.username}
                onChange={handleChange}
                required
                disabled={isEdit}
                placeholder="Nombre de usuario único"
              />
            </div>
            {isEdit && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <RiInformationLine className="flex-shrink-0" />
                El nombre de usuario no puede ser modificado
              </p>
            )}
          </div>

          {/* Rol */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rol <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {roleOptions.map((option) => {
                const isSelected = form.rol === option.value;
                const config = getRoleConfig(option.value);
                return (
                  <label
                    key={option.value}
                    className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? `${config.bg} border-blue-500 ring-2 ring-blue-200`
                        : "border-gray-200 hover:border-gray-300"
                    }`}>
                    <input
                      type="radio"
                      name="rol"
                      value={option.value}
                      checked={isSelected}
                      onChange={handleChange}
                      className="sr-only"
                      required
                    />
                    <div
                      className={`p-2 rounded-lg ${
                        isSelected ? config.bg : "bg-gray-100"
                      }`}>
                      {option.icon}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        isSelected ? config.color : "text-gray-700"
                      }`}>
                      {option.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <RiUserLine className="h-5 w-5 text-gray-400" />
              </div>
              <input
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                required
                placeholder="Nombre del usuario"
              />
            </div>
          </div>

          {/* Apellido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Apellido <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <RiUserFollowLine className="h-5 w-5 text-gray-400" />
              </div>
              <input
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                name="apellido"
                value={form.apellido}
                onChange={handleChange}
                required
                placeholder="Apellido del usuario"
              />
            </div>
          </div>

          {/* Contraseña */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {isEdit ? "Nueva contraseña (opcional)" : "Contraseña"}{" "}
              {!isEdit && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <RiLockPasswordLine className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                name="password"
                value={form.password}
                onChange={handleChange}
                required={!isEdit}
                placeholder={
                  isEdit
                    ? "Dejar vacío para mantener la actual"
                    : "Contraseña del usuario"
                }
              />
            </div>
            {isEdit && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <RiInformationLine className="flex-shrink-0" />
                Complete solo si desea cambiar la contraseña
              </p>
            )}
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
                  Usuario activo
                </span>
              </div>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-16">
              Los usuarios inactivos no podrán iniciar sesión en el sistema
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
                {isEdit ? "Guardar cambios" : "Crear usuario"}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
