// src/pages/Clients.jsx
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
import ClientProvidersModal from "../components/ClientProvidersModal"; // CORRECCIÓN: nombre y path consistentes

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

  // Modal de proveedores (UNA sola instancia)
  const [openProvidersModal, setOpenProvidersModal] = useState(false);
  const [currentClientProviders, setCurrentClientProviders] = useState([]);
  const [providersModalTitlePrefix, setProvidersModalTitlePrefix] =
    useState("");

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
      setErr("No se pudo obtener clientes.");
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
    // client.proveedores ahora es lista de objetos por el serializer backend
    setCurrentClientProviders(client.proveedores || []);
    setProvidersModalTitlePrefix(client.nombre || "");
    setOpenProvidersModal(true);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-sm text-gray-600">
            Gestión de clientes y su asignación de proveedores.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleCreate}
            className="px-4 py-2 rounded-xl bg-black text-white">
            Nuevo cliente
          </button>
        )}
      </div>

      <div className="bg-white border rounded-2xl p-4 mb-4">
        <div className="grid md:grid-cols-4 gap-3">
          <input
            placeholder="Buscar por nombre o NIT"
            className="border rounded-xl p-2 md:col-span-2"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <input
            placeholder="Ciudad"
            className="border rounded-xl p-2"
            value={ciudad}
            onChange={(e) => {
              setCiudad(e.target.value);
              setPage(1);
            }}
          />
          <select
            className="border rounded-xl p-2"
            value={isActive}
            onChange={(e) => {
              setIsActive(e.target.value);
              setPage(1);
            }}>
            <option value="">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>
      </div>

      <div className="bg-white border rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="p-3">ID</th>
                <th className="p-3">Nombre</th>
                <th className="p-3">NIT</th>
                <th className="p-3">Ciudad</th>
                <th className="p-3">Proveedores</th>
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
              {!loading && !err && clients.length === 0 && (
                <tr>
                  <td className="p-3" colSpan={7}>
                    Sin resultados
                  </td>
                </tr>
              )}
              {!loading &&
                !err &&
                clients.map((c) => (
                  <tr key={c.id} className="border-b last:border-b-0">
                    <td className="p-3">{c.id}</td>
                    <td className="p-3">{c.nombre}</td>
                    <td className="p-3">{c.nit}</td>
                    <td className="p-3">{c.ciudad}</td>
                    <td className="p-3">
                      <div>
                        <button
                          onClick={() => showProviders(c)}
                          className="flex flex-wrap gap-1 items-center text-left"
                          title="Ver proveedores asignados">
                          {(c.proveedores || []).slice(0, 4).map((p) => (
                            <span
                              key={p.id}
                              className="px-2 py-1 border rounded-full text-xs bg-white">
                              {p.nombre}
                            </span>
                          ))}

                          {(c.proveedores || []).length > 4 && (
                            <span className="text-xs text-gray-500 px-2 py-1">
                              +{(c.proveedores || []).length - 4}
                            </span>
                          )}
                        </button>
                      </div>
                    </td>

                    <td className="p-3">
                      {c.is_active ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-green-50 border text-green-700">
                          Activo
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-50 border text-gray-700">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2 justify-end">
                        {isAdmin && (
                          <button
                            className="px-3 py-1 border rounded-xl"
                            onClick={() => handleEdit(c)}>
                            Editar
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            className="px-3 py-1 border rounded-xl"
                            onClick={async () => {
                              await updateClient(c.id, {
                                is_active: !c.is_active,
                              });
                              await fetchData();
                            }}>
                            {c.is_active ? "Desactivar" : "Activar"}
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            className="px-3 py-1 border rounded-xl text-red-600"
                            onClick={() => askDelete(c)}>
                            Eliminar
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

      {/* Modal de proveedores (una sola instancia fuera del map) */}
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
        message={`¿Eliminar ${deleting?.nombre}? Esta acción es irreversible.`}
      />
    </div>
  );
}
