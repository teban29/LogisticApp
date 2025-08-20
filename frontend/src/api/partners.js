import api from "./axios";

// FGunciones para gestionar proveedores

export async function listProviders(params = {}) {
  const {
    page = 1,
    search = "",
    ciudad = "",
    is_active = "",
    ordering = "id",
  } = params;
  const res = await api.get("/api/partners/proveedores/", {
    params: {
      page,
      search: search || undefined,
      ciudad: ciudad || undefined,
      is_active: is_active !== "" ? is_active : undefined,
      ordering,
    },
  });
  return res.data;
}

export async function getProvider(id) {
  const res = await api.get(`/api/partners/proveedores/${id}/`);
  return res.data;
}

export async function createProvider(payload) {
  const res = await api.post("/api/partners/proveedores/", payload);
  return res.data;
}

export async function updateProvider(id, payload) {
  const res = await api.patch(`/api/partners/proveedores/${id}/`, payload);
  return res.data;
}

export async function deleteProvider(id) {
  const res = await api.delete(`/api/partners/proveedores/${id}/`);
  return res.data;
}

// FGunciones para gestionar clientes

export async function listClients(params = {}) {
  const {
    page = 1,
    search = "",
    ciudad = "",
    is_active = "",
    proveedores = "",
    ordering = "id",
  } = params;
  const res = await api.get("/api/partners/clientes/", {
    params: {
      page,
      search: search || undefined,
      ciudad: ciudad || undefined,
      is_active: is_active !== "" ? is_active : undefined,
      proveedores: proveedores || undefined,
      ordering,
    },
  });
  return res.data;
}

export async function getClient(id) {
  const res = await api.get(`/api/partners/clientes/${id}`);
  return res.data;
}

export async function createClient(payload) {
  const res = await api.post("/api/partners/clientes/", payload);
  return res.data;
}

export async function updateClient(id, payload) {
  const res = await api.patch(`/api/partners/clientes/${id}/`, payload);
  return res.data;
}

export async function deleteClient(id) {
  const res = await api.delete(`/api/partners/clientes/${id}/`);
  return res.data;
}
