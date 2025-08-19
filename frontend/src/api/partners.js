import api from "./axios";

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
