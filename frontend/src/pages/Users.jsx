import { useEffect, useMemo, useState } from "react";
import { listUsers, createUser, updateUser, deleteUser } from "../api/users";
import UserFormModal from "../components/UserFormModal";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState("");
  const [rol, setRol] = useState("");
  const [isActive, setIsActive] = useState("");
  const [ordering, setOrdering] = useState("id");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [openForm, setOpenForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [openDelete, setOpenDelete] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);

  const pageSize = 10; // coincide con PAGE_SIZE del backend

  const fetchData = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await listUsers({
        page,
        search,
        rol,
        is_active: isActive,
        ordering,
      });
      // Soporta respuesta paginada y no paginada
      if ("results" in data) {
        setUsers(data.results);
        setCount(data.count);
      } else {
        setUsers(Array.isArray(data) ? data : []);
        setCount(Array.isArray(data) ? data.length : 0);
      }
    } catch (e) {
      setErr("No se pudo obtener la lista.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, rol, isActive, ordering]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(count / pageSize)),
    [count]
  );

  const resetAndReload = async () => {
    setPage(1);
    await fetchData();
  };

  const handleCreate = () => {
    setEditingUser(null);
    setOpenForm(true);
  };

  const handleEdit = (u) => {
    setEditingUser(u);
    setOpenForm(true);
  };

  const submitForm = async (payload) => {
    if (editingUser) {
      await updateUser(editingUser.id, payload);
    } else {
      await createUser(payload);
    }
    await resetAndReload();
  };

  const askDelete = (u) => {
    setDeletingUser(u);
    setOpenDelete(true);
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;
    await deleteUser(deletingUser.id);
    setOpenDelete(false);
    setDeletingUser(null);
    await resetAndReload();
  };

  const clearFilters = () => {
    setSearch("");
    setRol("");
    setIsActive("");
    setOrdering("id");
    setPage(1);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Usuarios</h1>
        <p className="text-sm text-gray-600">
          Gestión de usuarios del sistema.
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white border rounded-2xl p-4 mb-4">
        <div className="grid md:grid-cols-5 gap-3">
          <input
            placeholder="Buscar por nombre, apellido o usuario"
            className="border rounded-xl p-2 md:col-span-2"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <select
            className="border rounded-xl p-2"
            value={rol}
            onChange={(e) => {
              setRol(e.target.value);
              setPage(1);
            }}>
            <option value="">Todos los roles</option>
            <option value="admin">Administrador</option>
            <option value="operador">Operador</option>
            <option value="cliente">Cliente</option>
          </select>
          <select
            className="border rounded-xl p-2"
            value={isActive}
            onChange={(e) => {
              setIsActive(e.target.value);
              setPage(1);
            }}>
            <option value="">Activos e inactivos</option>
            <option value="true">Solo activos</option>
            <option value="false">Solo inactivos</option>
          </select>
          <select
            className="border rounded-xl p-2"
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}>
            <option value="id">Orden: ID ↑</option>
            <option value="-id">Orden: ID ↓</option>
            <option value="nombre">Nombre ↑</option>
            <option value="-nombre">Nombre ↓</option>
            <option value="apellido">Apellido ↑</option>
            <option value="-apellido">Apellido ↓</option>
            <option value="username">Usuario ↑</option>
            <option value="-username">Usuario ↓</option>
          </select>
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={clearFilters}
            className="px-3 py-2 border rounded-xl">
            Limpiar
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 rounded-xl bg-black text-white">
            Nuevo usuario
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white border rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="p-3">ID</th>
                <th className="p-3">Usuario</th>
                <th className="p-3">Nombre</th>
                <th className="p-3">Apellido</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="p-3" colSpan={7}>
                    Cargando…
                  </td>
                </tr>
              )}
              {err && !loading && (
                <tr>
                  <td className="p-3 text-red-600" colSpan={7}>
                    {err}
                  </td>
                </tr>
              )}
              {!loading && !err && users.length === 0 && (
                <tr>
                  <td className="p-3" colSpan={7}>
                    Sin resultados
                  </td>
                </tr>
              )}
              {!loading &&
                !err &&
                users.map((u) => (
                  <tr key={u.id} className="border-b last:border-b-0">
                    <td className="p-3">{u.id}</td>
                    <td className="p-3">@{u.username}</td>
                    <td className="p-3">{u.nombre}</td>
                    <td className="p-3">{u.apellido}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 border rounded-full text-xs">
                        {u.rol}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          u.is_active
                            ? "bg-green-50 border text-green-700"
                            : "bg-gray-50 border text-gray-700"
                        }`}>
                        {u.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 justify-end">
                        <button
                          className="px-3 py-1 border rounded-xl"
                          onClick={() => handleEdit(u)}>
                          Editar
                        </button>
                        <button
                          className="px-3 py-1 border rounded-xl"
                          onClick={async () => {
                            await updateUser(u.id, { is_active: !u.is_active });
                            await fetchData();
                          }}>
                          {u.is_active ? "Desactivar" : "Activar"}
                        </button>
                        <button
                          className="px-3 py-1 border rounded-xl text-red-600"
                          onClick={() => askDelete(u)}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="flex items-center justify-between p-3">
          <p className="text-sm text-gray-600">Total: {count}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 border rounded-xl disabled:opacity-50">
              Anterior
            </button>
            <span className="px-2 py-1">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 border rounded-xl disabled:opacity-50">
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Modales */}
      <UserFormModal
        open={openForm}
        onClose={() => setOpenForm(false)}
        editingUser={editingUser}
        onSubmit={submitForm}
      />

      <ConfirmDialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={confirmDelete}
        title="Eliminar usuario"
        message={`¿Seguro que deseas eliminar al usuario @${deletingUser?.username}? Esta acción no se puede deshacer.`}
      />
    </div>
  );
}
