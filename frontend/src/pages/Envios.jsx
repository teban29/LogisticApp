import { useEffect, useMemo, useState } from "react";
import { useEnvios } from "../hooks/useEnvios";
import EnvioFormModal from "../components/EnvioFormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import { useAuth } from "../context/AuthContext";
import EnvioDetailModal from "../components/EnvioDetailModal";
import { useNavigate } from "react-router-dom";
import {
  RiAddLine,
  RiSearchLine,
  RiEditLine,
  RiEyeLine,
  RiTruckLine,
  RiUserLine,
  RiCalendarLine,
  RiMoneyDollarCircleLine,
  RiCloseLine,
  RiLoader4Line,
  RiErrorWarningLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiTimeLine,
  RiCheckLine,
  RiRefreshLine,
} from "react-icons/ri";

const ESTADOS_ENVIO = {
  borrador: {
    label: "Borrador",
    color: "bg-gray-100 text-gray-800",
    icon: RiTimeLine,
  },
  pendiente: {
    label: "Pendiente",
    color: "bg-yellow-100 text-yellow-800",
    icon: RiTimeLine,
  },
  en_transito: {
    label: "En Tránsito",
    color: "bg-blue-100 text-blue-800",
    icon: RiTruckLine,
  },
  entregado: {
    label: "Entregado",
    color: "bg-green-100 text-green-800",
    icon: RiCheckboxCircleLine,
  },
  cancelado: {
    label: "Cancelado",
    color: "bg-red-100 text-red-800",
    icon: RiCloseCircleLine,
  },
};

export default function Envios() {
  const { user } = useAuth();
  const isAdmin = user?.rol === "admin";
  const navigate = useNavigate();

  const {
    fetchEnvios, // ← CAMBIÉ getEnvios por fetchEnvios (debe coincidir con tu hook)
    crearEnvio,
    actualizarEnvio,
    eliminarEnvio,
    cambiarEstado,
    loading,
    error,
    envios,
    count,
  } = useEnvios();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const [openDetail, setOpenDetail] = useState(false);
  const [selectedEnvio, setSelectedEnvio] = useState(null);

  const pageSize = 10;

  const handleViewDetail = (envio) => {
    setSelectedEnvio(envio);
    setOpenDetail(true);
  };

  const fetchData = async () => {
    try {
      const params = { page, search };
      if (filtroEstado) params.estado = filtroEstado;

      await fetchEnvios(params);
    } catch (err) {
      console.error("Error loading envios:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, search, filtroEstado]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(count / pageSize)),
    [count]
  );

  const handleCreate = () => {
    setEditing(null);
    setOpenForm(true);
  };

  const handleEdit = (envio) => {
    setEditing(envio);
    setOpenForm(true);
  };

  const handleSubmit = async (payload, editingId = null) => {
    try {
      if (editingId) {
        await actualizarEnvio(editingId, payload);
      } else {
        await crearEnvio(payload);
      }
      await fetchData();
    } catch (err) {
      console.error("Error saving envio:", err);
    }
  };

  const handleDelete = async (envio) => {
    setDeleting(envio);
    setOpenDelete(true);
  };

  const confirmDelete = async () => {
    if (deleting) {
      try {
        await eliminarEnvio(deleting.id);
        await fetchData();
      } catch (err) {
        console.error("Error deleting envio:", err);
      } finally {
        setOpenDelete(false);
        setDeleting(null);
      }
    }
  };

  const handleCambiarEstado = async (envioId, nuevoEstado) => {
    try {
      await cambiarEstado(envioId, nuevoEstado);
      await fetchData();
    } catch (err) {
      console.error("Error changing state:", err);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setFiltroEstado("");
    setPage(1);
  };

  const hasFilters = search || filtroEstado;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Envíos</h1>
          <p className="text-sm text-gray-600 mt-1">
            Gestión de envíos de mercancía
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <RiRefreshLine className="text-lg" />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
          {isAdmin && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
              <RiAddLine className="text-lg" />
              <span>Nuevo envío</span>
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <RiSearchLine className="text-gray-500" />
            <h2 className="font-medium text-gray-700">Filtros</h2>
          </div>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
              <RiCloseLine />
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Búsqueda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <RiSearchLine className="h-4 w-4 text-gray-400" />
              </div>
              <input
                placeholder="Buscar por número de guía, conductor o cliente"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {/* Filtro por estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors">
              <option value="">Todos los estados</option>
              {Object.entries(ESTADOS_ENVIO).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de envíos */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {" "}
                {/* ← QUITÉ EL onClick Y EL key DE AQUÍ */}
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  N° Guía
                </th>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conductor
                </th>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor Total
                </th>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
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
                  <td className="p-8 text-center" colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                      <p className="text-gray-600">Cargando envíos...</p>
                    </div>
                  </td>
                </tr>
              )}

              {error && !loading && (
                <tr>
                  <td className="p-8 text-center" colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-4 text-red-600">
                      <RiErrorWarningLine className="text-3xl mb-2" />
                      <p className="font-medium">{error}</p>
                      <button
                        onClick={fetchData}
                        className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors">
                        Reintentar
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && !error && envios.length === 0 && (
                <tr>
                  <td className="p-8 text-center" colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-8">
                      <RiTruckLine className="text-4xl text-gray-400 mb-3" />
                      <p className="text-gray-600 font-medium">
                        No se encontraron envíos
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {hasFilters
                          ? "Intente ajustar los filtros de búsqueda"
                          : "Comience agregando un nuevo envío"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                !error &&
                envios.map((envio) => {
                  const EstadoIcon =
                    ESTADOS_ENVIO[envio.estado]?.icon || RiTimeLine;
                  const estadoConfig =
                    ESTADOS_ENVIO[envio.estado] || ESTADOS_ENVIO.borrador;

                  return (
                    <tr key={envio.id}>
                      {" "}
                      {/* ← key CORRECTO AQUÍ */}
                      <td
                        className="p-4 font-mono text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600 hover:underline"
                        onClick={() => navigate(`/envios/${envio.id}`)}
                        title="Ver detalles del envío">
                        {envio.numero_guia}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <RiUserLine className="text-gray-400 flex-shrink-0" />
                          <span className="font-medium">
                            {envio.cliente_nombre}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <RiUserLine className="text-gray-400 flex-shrink-0" />
                          <span>{envio.conductor}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <RiMoneyDollarCircleLine className="text-gray-400 flex-shrink-0" />
                          <span className="font-medium">
                            ${envio.valor_total}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <RiCalendarLine className="text-gray-400 flex-shrink-0" />
                          <span className="text-sm">
                            {new Date(envio.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${estadoConfig.color}`}>
                          <EstadoIcon className="text-sm" />
                          {estadoConfig.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleViewDetail(envio)}
                            className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Ver detalle">
                            <RiEyeLine className="text-lg" />
                          </button>
                          <button
                            onClick={() => handleEdit(envio)}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar envío">
                            <RiEditLine className="text-lg" />
                          </button>
                          {isAdmin && envio.estado === "pendiente" && (
                            <button
                              onClick={() =>
                                handleCambiarEstado(envio.id, "en_transito")
                              }
                              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Marcar como en tránsito">
                              <RiCheckLine className="text-lg" />
                            </button>
                          )}
                          {isAdmin && envio.estado === "en_transito" && (
                            <button
                              onClick={() =>
                                handleCambiarEstado(envio.id, "entregado")
                              }
                              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Marcar como entregado">
                              <RiCheckLine className="text-lg" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {!loading && !error && envios.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-700 mb-4 sm:mb-0">
              Mostrando{" "}
              <span className="font-medium">{(page - 1) * pageSize + 1}</span> -{" "}
              <span className="font-medium">
                {Math.min(page * pageSize, count)}
              </span>{" "}
              de <span className="font-medium">{count}</span> envíos
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

      {/* Modal de formulario */}
      {openForm && (
        <EnvioFormModal
          open={openForm}
          onClose={() => setOpenForm(false)}
          onSubmit={handleSubmit}
          editing={editing}
        />
      )}

      {/* Modal de detalle */}
      {openDetail && (
        <EnvioDetailModal
          open={openDetail}
          onClose={() => setOpenDetail(false)}
          envio={selectedEnvio}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      <ConfirmDialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={confirmDelete}
        title="Eliminar envío"
        message="¿Está seguro de eliminar este envío? Esta acción no se puede deshacer."
        type="danger"
      />
    </div>
  );
}
