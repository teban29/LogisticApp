// src/api/cargas.js
import api from "./axios";

export async function listCargas(params = {}) {
  const { page = 1, search = "" } = params;
  const res = await api.get("/api/cargas/", {
    params: {
      page,
      search: search || undefined,
      ordering: "-created_at",
    },
  });
  return res.data;
}

export async function getCarga(id) {
  const res = await api.get(`/api/cargas/${id}/`);
  return res.data;
}

export async function createCarga(payload) {
  const form = new FormData();
  form.append("cliente", payload.cliente);
  form.append("proveedor", payload.proveedor);
  form.append("remision", payload.remision);
  if (payload.observaciones)
    form.append("observaciones", payload.observaciones);
  form.append(
    "auto_generar_unidades",
    payload.auto_generar_unidades ? "true" : "false"
  );

  if (payload.items && payload.items.length > 0) {
    form.append("items_data", JSON.stringify(payload.items));
  }

  if (payload.facturaFile) {
    form.append("factura", payload.facturaFile);
  }

  for (const pair of form.entries()) {
    console.log("FormData entry:", pair[0], pair[1]);
  }

  const res = await api.post("/api/cargas/", form);
  return res.data;
}

export async function updateCarga(id, payload) {
  const form = new FormData();
  if (payload.remision) form.append("remision", payload.remision);
  if (payload.observaciones) form.append("observaciones", payload.observaciones);
  if (typeof payload.auto_generar_unidades !== "undefined")
    form.append(
      "auto_generar_unidades",
      payload.auto_generar_unidades ? "true" : "false"
    );
  if (payload.items) form.append("items_data", JSON.stringify(payload.items));
  if (payload.facturaFile) form.append("factura", payload.facturaFile);

  const res = await api.patch(`/api/cargas/${id}/`, form);
  return res.data;
}

export async function generarUnidades(cargaId) {
  const res = await api.post(`/api/cargas/${cargaId}/generar_unidades/`);
  return res.data;
}

export async function listUnidades(params = {}) {
  const res = await api.get("/api/cargas/unidades/", { params });
  return res.data;
}
