import { useEffect, useMemo, useState } from "react";
import {
  listClients,
  createClient,
  updateClient,
  deleteClient,
} from "../api/partners";
import ClientFormModal from "../components/ClientFormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import { useAuth } from "../context/AuthContext";
import ClientProvidersModal from "../components/ClientProvidersModal";
import {
  RiAddLine,
  RiSearchLine,
  RiEditLine,
  RiDeleteBinLine,
  RiEyeLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiRefreshLine,
  RiFilterLine,
  RiCloseLine,
  RiUserLine,
  RiBuildingLine,
  RiMapPinLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine
} from "react-icons/ri";

export default function Clients() {
  const { user } = useAuth();
  const isAdmin = user?.rol === "admin";
  const [clients, setClients] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [isActive, setIsActive] = useState("");
  const [ordering, setOrdering] = useState("id");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const [openProvidersModal, setOpenProvidersModal] = useState(false);
  const [currentClientProviders, setCurrentClientProviders] = useState([]);
  const [providersModalTitlePrefix, setProvidersModalTitlePrefix] = useState("");

  const pageSize = 10;

  const fetchData = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await listClients({
        page,
        search,
        ciudad,
        is_active: isActive,
        ordering,
      });
      if ("results" in data) {
        setClients(data.results);
        setCount(data.count);
      } else {
        setClients(Array.isArray(data) ? data : []);
        setCount(Array.isArray(data) ? data.length : 0);
      }
    } catch (e) {
      setErr("No se pudo obtener la lista de clientes. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, ciudad, isActive, ordering]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(count / pageSize)),
    [count]
  );

  const resetAndReload = async () => {
    setPage(1);
    await fetchData();
  };

  const handleCreate = () => {
    setEditing(null);
    setOpenForm(true);
  };
  const handleEdit = (c) => {
    setEditing(c);
    setOpenForm(true);
  };

  const submitForm = async (payload) => {
    if (editing) await updateClient(editing.id, payload);
    else await createClient(payload);
    await resetAndReload();
  };

  const askDelete = (c) => {
    setDeleting(c);
    setOpenDelete(true);
  };
  const confirmDelete = async () => {
    if (!deleting) return;
    await deleteClient(deleting.id);
    setOpenDelete(false);
    setDeleting(null);
    await resetAndReload();
  };

  const showProviders = (client) => {
    setCurrentClientProviders(client.proveedores || []);
    setProvidersModalTitlePrefix(client.nombre || "");
    setOpenProvidersModal(true);
  };

  const clearFilters = () => {
    setSearch("");
    setCiudad("");
    setIsActive("");
    setPage(1);
  };

  const hasActiveFilters = search || ciudad || isActive;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-sm text-gray-600 mt-1">
            Gestión de clientes y su asignación de proveedores
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Recargar datos"
          >
            <RiRefreshLine className="text-lg" />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
          {isAdmin && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <RiAddLine className="text-lg" />
              <span>Nuevo cliente</span>
            </button>
          )}
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
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <RiCloseLine />
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <RiSearchLine className="h-4 w-4 text-gray-400" />
            </div>
            <input
              placeholder="Buscar por nombre o NIT"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <RiMapPinLine className="h-4 w-4 text-gray-400" />
            </div>
            <input
              placeholder="Ciudad"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              value={ciudad}
              onChange={(e) => {
                setCiudad(e.target.value);
                setPage(1);
              }}
            />
          </div>
          
          <select
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            value={isActive}
            onChange={(e) => {
              setIsActive(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Todos los estados</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Tabla de clientes */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NIT</th>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ciudad</th>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedores</th>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                <th className="p-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading && (
                <tr>
                  <td className="p-8 text-center" colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                      <p className="text-gray-600">Cargando clientes...</p>
                    </div>
                  </td>
                </tr>
              )}
              
              {err && !loading && (
                <tr>
                  <td className="p-8 text-center" colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-4 text-red-600">
                      <RiCloseCircleLine className="text-3xl mb-2" />
                      <p className="font-medium">{err}</p>
                      <button
                        onClick={fetchData}
                        className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                      >
                        Reintentar
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              
              {!loading && !err && clients.length === 0 && (
                <tr>
                  <td className="p-8 text-center" colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-8">
                      <RiUserLine className="text-4xl text-gray-400 mb-3" />
                      <p className="text-gray-600 font-medium">No se encontraron clientes</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {hasActiveFilters
                          ? "Intente ajustar los filtros"
                          : "Comience agregando un nuevo cliente"
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              
              {!loading &&
                !err &&
                clients.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">#{c.id}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <RiBuildingLine className="text-gray-400 flex-shrink-0" />
                        <span className="font-medium">{c.nombre}</span>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-sm">{c.nit}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <RiMapPinLine className="text-gray-400 flex-shrink-0" />
                        <span>{c.ciudad || "—"}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => showProviders(c)}
                        className="flex flex-wrap gap-1.5 items-center text-left hover:text-blue-600 transition-colors"
                        title="Ver proveedores asignados"
                      >
                        {(c.proveedores || []).slice(0, 3).map((p) => (
                          <span
                            key={p.id}
                            className="px-2.5 py-1 border border-gray-200 rounded-full text-xs bg-gray-50 text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                          >
                            {p.nombre}
                          </span>
                        ))}
                        {(c.proveedores || []).length > 3 && (
                          <span className="text-xs text-gray-500 px-2 py-1">
                            +{(c.proveedores || []).length - 3}
                          </span>
                        )}
                        {(c.proveedores || []).length === 0 && (
                          <span className="text-xs text-gray-400 italic">Sin proveedores</span>
                        )}
                      </button>
                    </td>
                    <td className="p-4">
                      {c.is_active ? (
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
                          onClick={() => showProviders(c)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver proveedores"
                        >
                          <RiEyeLine className="text-lg" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleEdit(c)}
                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Editar cliente"
                          >
                            <RiEditLine className="text-lg" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={async () => {
                              await updateClient(c.id, {
                                is_active: !c.is_active,
                              });
                              await fetchData();
                            }}
                            className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title={c.is_active ? "Desactivar" : "Activar"}
                          >
                            {c.is_active ? <RiCloseCircleLine /> : <RiCheckboxCircleLine />}
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => askDelete(c)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar cliente"
                          >
                            <RiDeleteBinLine className="text-lg" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {!loading && !err && clients.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-700 mb-4 sm:mb-0">
              Mostrando <span className="font-medium">{(page - 1) * pageSize + 1}</span> -{" "}
              <span className="font-medium">{Math.min(page * pageSize, count)}</span> de{" "}
              <span className="font-medium">{count}</span> clientes
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
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
                      } transition-colors`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && <span className="px-1">...</span>}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
                <RiArrowRightSLine />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      <ClientProvidersModal
        open={openProvidersModal}
        onClose={() => setOpenProvidersModal(false)}
        providers={currentClientProviders}
        titlePrefix={providersModalTitlePrefix}
      />

      <ClientFormModal
        open={openForm}
        onClose={() => setOpenForm(false)}
        editing={editing}
        onSubmit={submitForm}
      />
      
      <ConfirmDialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={confirmDelete}
        title="Eliminar cliente"
        message={`¿Está seguro de eliminar al cliente "${deleting?.nombre}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
}