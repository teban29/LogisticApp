// src/pages/Cargas.jsx
import { useEffect, useMemo, useState } from "react";
import {
  listCargas,
  createCarga,
  generarUnidades,
  getCarga,
} from "../api/cargas";
import CargaFormModal from "../components/CargaFormModal";
import ConfirmDialog from "../components/ConfirmDialog";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/Modal";

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
  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState(null);

  // detail modal
  const [openDetail, setOpenDetail] = useState(false);
  const [currentCargaDetail, setCurrentCargaDetail] = useState(null);

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
      setErr("No se pudieron cargar las cargas.");
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
    console.log("handleCreate fired — openForm before:", openForm);
    setOpenForm(true);
    console.log("openForm set to true");
  };

  const handleCreateSubmit = async (payload) => {
    // payload as built in CargaFormModal
    await createCarga(payload);
    await fetchData();
  };

  const handleGenerate = async (cargaId) => {
    try {
      await generarUnidades(cargaId);
      await fetchData();
      alert("Unidades generadas.");
    } catch (err) {
      console.error(err);
      alert("Error generando unidades.");
    }
  };

  const openDetailModal = async (cargaId) => {
    try {
      const data = await getCarga(cargaId);
      setCurrentCargaDetail(data);
      setOpenDetail(true);
    } catch (err) {
      console.error(err);
      alert("No se pudo obtener detalle.");
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Cargas</h1>
          <p className="text-sm text-gray-600">
            Ingreso de mercancía por cargas.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleCreate}
            className="px-4 py-2 rounded-xl bg-black text-white">
            Nueva carga
          </button>
        )}
      </div>

      <div className="bg-white border rounded-2xl p-4 mb-4">
        <div className="grid md:grid-cols-3 gap-3">
          <input
            placeholder="Buscar remisión / cliente"
            className="border rounded-xl p-2 md:col-span-2"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="bg-white border rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="p-3">ID</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Proveedor</th>
                <th className="p-3">Remisión</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Items</th>
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
              {!loading && !err && cargas.length === 0 && (
                <tr>
                  <td className="p-3" colSpan={7}>
                    Sin resultados
                  </td>
                </tr>
              )}
              {!loading &&
                !err &&
                cargas.map((c) => (
                  <tr key={c.id} className="border-b last:border-b-0">
                    <td className="p-3">{c.id}</td>
                    <td className="p-3">{c.cliente_nombre}</td>
                    <td className="p-3">{c.proveedor_nombre}</td>
                    <td className="p-3">{c.remision}</td>
                    <td className="p-3">
                      {new Date(c.created_at).toLocaleString()}
                    </td>
                    <td className="p-3">{(c.items || []).length}</td>
                    <td className="p-3">
                      <div className="flex gap-2 justify-end">
                        <button
                          className="px-3 py-1 border rounded-xl"
                          onClick={() => openDetailModal(c.id)}>
                          Ver
                        </button>
                        {isAdmin && (
                          <button
                            className="px-3 py-1 border rounded-xl"
                            onClick={() => handleGenerate(c.id)}>
                            Generar unidades
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

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

      <CargaFormModal
        open={openForm}
        onClose={() => setOpenForm(false)}
        onSubmit={handleCreateSubmit}
      />

      {/* Detail modal */}
      <Modal
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        title={
          currentCargaDetail ? `Carga ${currentCargaDetail.id}` : "Detalle"
        }>
        {currentCargaDetail ? (
          <div className="space-y-3">
            <div>
              <strong>Cliente:</strong> {currentCargaDetail.cliente_nombre}
            </div>
            <div>
              <strong>Proveedor:</strong> {currentCargaDetail.proveedor_nombre}
            </div>
            <div>
              <strong>Remisión:</strong> {currentCargaDetail.remision}
            </div>
            <div>
              <strong>Factura:</strong>
              {currentCargaDetail.factura ? (
                <div className="mt-2 space-y-2">
                  {/* Enlace para abrir en nueva pestaña */}
                  <div>
                    <a
                    target="_blank"
                      href={currentCargaDetail.factura}
                      download
                      className="ml-3 text-sm px-2 py-1 border rounded-md">
                      Abrir factura
                    </a>
                  </div>

                  {/* Si es imagen, mostrar mini-preview; si es PDF, mostrar icono con enlace */}
                  {(() => {
                    // intentar inferir extensión del archivo
                    const url = currentCargaDetail.factura;
                    const lower = (url || "").toLowerCase();
                    if (
                      lower.endsWith(".png") ||
                      lower.endsWith(".jpg") ||
                      lower.endsWith(".jpeg") ||
                      lower.endsWith(".gif")
                    ) {
                      return (
                        <div className="mt-2">
                          <img
                            src={url}
                            alt="Factura"
                            className="max-h-48 object-contain border rounded-md"
                          />
                        </div>
                      );
                    }
                    if (lower.endsWith(".pdf")) {
                      return (
                        <div className="mt-2 p-3 border rounded-md bg-gray-50">
                          <div className="flex items-center gap-3">
                            <svg
                              className="w-6 h-6 text-gray-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 2v7h7"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M21 21H3V3h9"
                              />
                            </svg>
                            <div>
                              <div className="font-medium">Archivo PDF</div>
                              <div className="text-sm text-gray-600">
                                {url.split("/").pop()}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="mt-2 text-sm">{url.split("/").pop()}</div>
                    );
                  })()}
                </div>
              ) : (
                <span className="ml-2 text-sm text-gray-600">
                  No hay factura adjunta
                </span>
              )}
            </div>
            <div>
              <strong>Items:</strong>
            </div>
            <div className="space-y-2">
              {(currentCargaDetail.items || []).map((it) => (
                <div key={it.id} className="p-2 border rounded-lg">
                  <div className="font-medium">
                    {it.producto.nombre} — {it.producto.sku}
                  </div>
                  <div className="text-sm">Cantidad: {it.cantidad}</div>
                  <div className="text-sm">
                    Unidades generadas: {it.unidades_count}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>Cargando…</div>
        )}
      </Modal>

      <ConfirmDialog
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={() => {
          /* delete if implemented */
        }}
        title="Eliminar carga"
        message="¿Eliminar carga?"
      />
    </div>
  );
}
