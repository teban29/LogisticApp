import { useEffect, useMemo, useState } from "react";
import {
  listCargas,
  createCarga,
  generarUnidades,
  getCarga,
  descargarEtiquetasPorItem,
  descargarEtiquetasDeCarga,
  descargarBlobComoPDF,
  updateCarga,
} from "../api/cargas";
import CargaFormModal from "../components/CargaFormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";
import {
  RiAddLine,
  RiSearchLine,
  RiEditLine,
  RiEyeLine,
  RiRefreshLine,
  RiFilterLine,
  RiCloseLine,
  RiFileTextLine,
  RiPrinterLine,
  RiBox3Line,
  RiUserLine,
  RiTruckLine,
  RiCalendarLine,
  RiNumbersLine,
  RiDownloadLine,
  RiLoader4Line,
  RiErrorWarningLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiFilePdfLine,
  RiImageLine,
  RiFileLine,
} from "react-icons/ri";
import { useNavigate } from "react-router-dom";

export default function Cargas() {
  const { user } = useAuth();
  const isAdmin = user?.rol === "admin" || user?.rol === "operador";
  const [cargas, setCargas] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState(null);

  // detail modal
  const [openDetail, setOpenDetail] = useState(false);
  const [currentCargaDetail, setCurrentCargaDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const pageSize = 10;

  const fetchData = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await listCargas({ page, search });
      if ("results" in data) {
        setCargas(data.results);
        setCount(data.count);
      } else {
        setCargas(Array.isArray(data) ? data : []);
        setCount(Array.isArray(data) ? data.length : 0);
      }
    } catch (err) {
      setErr("No se pudieron cargar las cargas. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, search]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(count / pageSize)),
    [count]
  );

  const handleCreate = () => {
    setEditing(null);
    setOpenForm(true);
  };

  const handleEdit = (c) => {
    setEditing(c);
    setOpenForm(true);
  };

  const handleCreateSubmit = async (payload, editingId = null) => {
    if (editingId) {
      await updateCarga(editingId, payload);
    } else {
      await createCarga(payload);
    }
    setOpenForm(false);
    await fetchData();
  };

  const handleGenerate = async (cargaId) => {
    try {
      await generarUnidades(cargaId);
      await fetchData();
      // Mostrar notificación de éxito
    } catch (err) {
      console.error(err);
      alert("Error generando unidades. Por favor, intente nuevamente.");
    }
  };

  const openDetailModal = async (cargaId) => {
    setLoadingDetail(true);
    try {
      const data = await getCarga(cargaId);
      setCurrentCargaDetail(data);
      setOpenDetail(true);
    } catch (err) {
      console.error(err);
      alert("No se pudo obtener el detalle de la carga.");
    } finally {
      setLoadingDetail(false);
    }
  };

  const imprimirEtiquetasItem = async (cargaId, itemId) => {
    try {
      const blob = await descargarEtiquetasPorItem(cargaId, itemId);
      descargarBlobComoPDF(
        blob,
        `etiquetas_carga_${cargaId}_item_${itemId}.pdf`
      );
    } catch (e) {
      console.error(e);
      alert("No se pudieron generar las etiquetas");
    }
  };

  const imprimirEtiquetasCarga = async (cargaId) => {
    try {
      const blob = await descargarEtiquetasDeCarga(cargaId);
      descargarBlobComoPDF(blob, `etiquetas_carga_${cargaId}.pdf`);
    } catch (e) {
      console.error(e);
      alert("No se pudieron generar las etiquetas de la carga.");
    }
  };

  const clearSearch = () => {
    setSearch("");
    setPage(1);
  };

  const hasSearch = search.length > 0;

  const navigate = useNavigate();

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cargas</h1>
          <p className="text-sm text-gray-600 mt-1">
            Ingreso de mercancía por cargas
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Recargar cargas">
            <RiRefreshLine className="text-lg" />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
          {isAdmin && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
              <RiAddLine className="text-lg" />
              <span>Nueva carga</span>
            </button>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <RiFilterLine className="text-gray-500" />
            <h2 className="font-medium text-gray-700">Búsqueda</h2>
          </div>
          {hasSearch && (
            <button
              onClick={clearSearch}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
              <RiCloseLine />
              Limpiar búsqueda
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <RiSearchLine className="h-4 w-4 text-gray-400" />
            </div>
            <input
              placeholder="Buscar por remisión, cliente o proveedor"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      {/* Tabla de cargas */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Proveedor
                </th>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Remisión
                </th>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
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
                      <p className="text-gray-600">Cargando cargas...</p>
                    </div>
                  </td>
                </tr>
              )}

              {err && !loading && (
                <tr>
                  <td className="p-8 text-center" colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-4 text-red-600">
                      <RiErrorWarningLine className="text-3xl mb-2" />
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

              {!loading && !err && cargas.length === 0 && (
                <tr>
                  <td className="p-8 text-center" colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-8">
                      <RiBox3Line className="text-4xl text-gray-400 mb-3" />
                      <p className="text-gray-600 font-medium">
                        No se encontraron cargas
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {hasSearch
                          ? "Intente ajustar los términos de búsqueda"
                          : "Comience agregando una nueva carga"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                !err &&
                cargas.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">#{c.id}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <RiUserLine className="text-gray-400 flex-shrink-0" />
                        <span className="font-medium">{c.cliente_nombre}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <RiTruckLine className="text-gray-400 flex-shrink-0" />
                        <span>{c.proveedor_nombre}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <RiFileTextLine className="text-gray-400 flex-shrink-0" />
                        <span className="font-mono text-sm">{c.remision}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <RiCalendarLine className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm">
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <RiNumbersLine className="text-gray-400 flex-shrink-0" />
                        <span className="text-sm font-medium">
                          {(c.items || []).length}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => openDetailModal(c.id)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver detalles">
                          <RiEyeLine className="text-lg" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => handleEdit(c)}
                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Editar carga">
                            <RiEditLine className="text-lg" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => handleGenerate(c.id)}
                            className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Generar unidades">
                            <RiRefreshLine className="text-lg" />
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
        {!loading && !err && cargas.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-700 mb-4 sm:mb-0">
              Mostrando{" "}
              <span className="font-medium">{(page - 1) * pageSize + 1}</span> -{" "}
              <span className="font-medium">
                {Math.min(page * pageSize, count)}
              </span>{" "}
              de <span className="font-medium">{count}</span> cargas
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
        <CargaFormModal
          open={openForm}
          onClose={() => setOpenForm(false)}
          onSubmit={handleCreateSubmit}
          editing={editing}
        />
      )}

      {/* Modal de detalle */}
      <Modal
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        title={
          currentCargaDetail
            ? `Carga #${currentCargaDetail.id}`
            : "Detalle de carga"
        }
        size="lg">
        {loadingDetail ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : currentCargaDetail ? (
          <div className="space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <RiUserLine className="text-blue-600" />
                  <span className="font-medium">Cliente</span>
                </div>
                <p className="text-gray-900">
                  {currentCargaDetail.cliente_nombre}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <RiTruckLine className="text-green-600" />
                  <span className="font-medium">Proveedor</span>
                </div>
                <p className="text-gray-900">
                  {currentCargaDetail.proveedor_nombre}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <RiFileTextLine className="text-purple-600" />
                  <span className="font-medium">Remisión</span>
                </div>
                <p className="font-mono text-gray-900">
                  {currentCargaDetail.remision}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <RiCalendarLine className="text-orange-600" />
                  <span className="font-medium">Fecha de creación</span>
                </div>
                <p className="text-gray-900">
                  {new Date(currentCargaDetail.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex">
              <button
                onClick={() => {
                  setOpenDetail(false);
                  navigate(`/cargas/${currentCargaDetail.id}`);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg transition-colors border border-blue-200 shadow-none"
                style={{ fontSize: "15px" }}
              >
                <RiEyeLine className="text-blue-500 text-base" />
                Ver más detalles
              </button>
            </div>

            {/* Factura */}
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <RiFileTextLine />
                Factura
              </h3>
              {currentCargaDetail.factura ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-3">
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href={currentCargaDetail.factura}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      <RiDownloadLine />
                      Descargar factura
                    </a>
                    <button
                      onClick={() =>
                        imprimirEtiquetasCarga(currentCargaDetail.id)
                      }
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      <RiPrinterLine />
                      Imprimir todas las etiquetas
                    </button>
                  </div>

                  {/* Vista previa de factura */}
                  {(() => {
                    const url = currentCargaDetail.factura;
                    const lower = url.toLowerCase();

                    if (lower.match(/\.(png|jpg|jpeg|gif|webp)$/)) {
                      return (
                        <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                          <div className="flex items-center gap-2 mb-3">
                            <RiImageLine className="text-blue-600" />
                            <span className="font-medium">
                              Vista previa de imagen
                            </span>
                          </div>
                          <img
                            src={url}
                            alt="Factura"
                            className="max-h-64 w-auto object-contain border rounded-md mx-auto"
                          />
                        </div>
                      );
                    }

                    if (lower.endsWith(".pdf")) {
                      return (
                        <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                          <div className="flex items-center gap-3">
                            <RiFilePdfLine className="text-red-600 text-2xl" />
                            <div>
                              <div className="font-medium">Documento PDF</div>
                              <div className="text-sm text-gray-600">
                                {url.split("/").pop()}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-center gap-3">
                          <RiFileLine className="text-gray-600 text-2xl" />
                          <div>
                            <div className="font-medium">Archivo adjunto</div>
                            <div className="text-sm text-gray-600">
                              {url.split("/").pop()}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-gray-500 italic">
                  No hay factura adjunta
                </div>
              )}
            </div>

            {/* Items */}
            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <RiBox3Line />
                Items de la carga ({(currentCargaDetail.items || []).length})
              </h3>
              <div className="space-y-3">
                {(currentCargaDetail.items || []).map((it) => (
                  <div
                    key={it.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {it.producto.nombre}
                        </h4>
                        <p className="text-sm text-gray-600 font-mono">
                          {it.producto.sku}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {it.cantidad} unidades
                      </span>
                    </div>

                    <div className="flex justify-between items-center mt-3">
                      <span className="text-sm text-gray-600">
                        Unidades generadas: {it.unidades_count}
                      </span>
                      <button
                        onClick={() =>
                          imprimirEtiquetasItem(currentCargaDetail.id, it.id)
                        }
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                        <RiPrinterLine />
                        Imprimir etiquetas
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No se pudo cargar la información
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={() => {
          /* delete if implemented */
        }}
        title="Eliminar carga"
        message="¿Está seguro de eliminar esta carga?"
        type="danger"
      />
    </div>
  );
}
