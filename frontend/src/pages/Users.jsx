import { useEffect, useMemo, useState } from "react";
import { listUsers, createUser, updateUser, deleteUser } from "../api/users";
import UserFormModal from "../components/UserFormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  RiAddLine,
  RiSearchLine,
  RiEditLine,
  RiDeleteBinLine,
  RiRefreshLine,
  RiFilterLine,
  RiCloseLine,
  RiUserLine,
  RiUserSettingsLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiShieldUserLine,
  RiUserStarLine,
  RiBuildingLine,
  RiInformationLine
} from "react-icons/ri";

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

  const pageSize = 10;

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
      if ("results" in data) {
        setUsers(data.results);
        setCount(data.count);
      } else {
        setUsers(Array.isArray(data) ? data : []);
        setCount(Array.isArray(data) ? data.length : 0);
      }
    } catch (e) {
      setErr("No se pudo obtener la lista de usuarios. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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

  const hasActiveFilters = search || rol || isActive;

  // Iconos para diferentes roles
  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return <RiShieldUserLine className="text-purple-600" />;
      case "operador":
        return <RiUserSettingsLine className="text-blue-600" />;
      case "cliente":
        return <RiUserLine className="text-green-600" />;
      default:
        return <RiUserLine className="text-gray-600" />;
    }
  };

  // Colores y textos para roles
  const getRoleConfig = (role) => {
    switch (role) {
      case "admin":
        return {
          bg: "bg-purple-100",
          text: "text-purple-800",
          label: "Administrador",
        };
      case "operador":
        return { bg: "bg-blue-100", text: "text-blue-800", label: "Operador" };
      case "cliente":
        return { bg: "bg-green-100", text: "text-green-800", label: "Cliente" };
      case "conductor":
        return { bg: "bg-orange-100", text: "text-orange-800", label: "Conductor" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-800", label: role };
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-600 mt-1">
            Gestión de usuarios del sistema
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Recargar datos">
            <RiRefreshLine className="text-lg" />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
            <RiAddLine className="text-lg" />
            <span>Nuevo usuario</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <RiFilterLine className="text-gray-500" />
            <h2 className="font-medium text-gray-700">Filtros</h2>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
              <RiCloseLine />
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative md:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <RiSearchLine className="h-4 w-4 text-gray-400" />
            </div>
            <input
              placeholder="Buscar por nombre, apellido o usuario"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
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
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            value={isActive}
            onChange={(e) => {
              setIsActive(e.target.value);
              setPage(1);
            }}>
            <option value="">Todos los estados</option>
            <option value="true">Solo activos</option>
            <option value="false">Solo inactivos</option>
          </select>

          <select
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}>
            <option value="id">ID ↑</option>
            <option value="-id">ID ↓</option>
            <option value="nombre">Nombre ↑</option>
            <option value="-nombre">Nombre ↓</option>
            <option value="apellido">Apellido ↑</option>
            <option value="-apellido">Apellido ↓</option>
            <option value="username">Usuario ↑</option>
            <option value="-username">Usuario ↓</option>
          </select>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Apellido
                </th>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="p-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading && (
                <tr>
                  <td className="p-8 text-center" colSpan={8}>
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                      <p className="text-gray-600">Cargando usuarios...</p>
                    </div>
                  </td>
                </tr>
              )}

              {err && !loading && (
                <tr>
                  <td className="p-8 text-center" colSpan={8}>
                    <div className="flex flex-col items-center justify-center py-4 text-red-600">
                      <RiCloseCircleLine className="text-3xl mb-2" />
                      <p className="font-medium">{err}</p>
                      <button
                        onClick={fetchData}
                        className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors">
                        Reintentar
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !err && users.length === 0 && (
                <tr>
                  <td className="p-8 text-center" colSpan={8}>
                    <div className="flex flex-col items-center justify-center py-8">
                      <RiUserLine className="text-4xl text-gray-400 mb-3" />
                      <p className="text-gray-600 font-medium">
                        No se encontraron usuarios
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {hasActiveFilters
                          ? "Intente ajustar los filtros"
                          : "Comience agregando un nuevo usuario"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                !err &&
                users.map((u) => {
                  const roleConfig = getRoleConfig(u.rol);
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium text-gray-900">#{u.id}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <RiUserStarLine className="text-gray-400 flex-shrink-0" />
                          <span className="font-mono text-sm">
                            @{u.username}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 font-medium">{u.nombre}</td>
                      <td className="p-4 font-medium">{u.apellido}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${roleConfig.bg} ${roleConfig.text}`}>
                          {getRoleIcon(u.rol)}
                          {roleConfig.label}
                        </span>
                      </td>

                      <td className="p-4">
                        {u.rol === "cliente" ? (
                          u.cliente_nombre ? (
                            <div className="flex items-center gap-2">
                              <RiBuildingLine className="text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-700">
                                {u.cliente_nombre}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              <RiInformationLine className="text-xs" />
                              Sin asignar
                            </span>
                          )
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>

                      <td className="p-4">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <RiCheckboxCircleLine />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            <RiCloseCircleLine />
                            Inactivo
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEdit(u)}
                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Editar usuario">
                            <RiEditLine className="text-lg" />
                          </button>
                          <button
                            onClick={async () => {
                              await updateUser(u.id, {
                                is_active: !u.is_active,
                              });
                              await fetchData();
                            }}
                            className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title={u.is_active ? "Desactivar" : "Activar"}>
                            {u.is_active ? (
                              <RiCloseCircleLine />
                            ) : (
                              <RiCheckboxCircleLine />
                            )}
                          </button>
                          <button
                            onClick={() => askDelete(u)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar usuario">
                            <RiDeleteBinLine className="text-lg" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {!loading && !err && users.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-700 mb-4 sm:mb-0">
              Mostrando{" "}
              <span className="font-medium">{(page - 1) * pageSize + 1}</span> -{" "}
              <span className="font-medium">
                {Math.min(page * pageSize, count)}
              </span>{" "}
              de <span className="font-medium">{count}</span> usuarios
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <RiArrowLeftSLine />
                Anterior
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 flex items-center justify-center text-sm rounded-lg ${
                        page === pageNum
                          ? "bg-blue-600 text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      } transition-colors`}>
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && <span className="px-1">...</span>}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Siguiente
                <RiArrowRightSLine />
              </button>
            </div>
          </div>
        )}
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
        message={`¿Está seguro de eliminar al usuario "@${deletingUser?.username}"? Esta acción no se puede deshacer.`}
        type="danger"
      />
    </div>
  );
}
