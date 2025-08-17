import api from "./axios";

export async function listUsers(params = {}) {
  const {
    page = 1,
    search = "",
    rol = "",
    is_active = "",
    ordering = "id",
  } = params;
  const res = await api.get("/api/auth/usuarios/", {
    params: {
      page,
      search: search || undefined,
      rol: rol || undefined,
      is_active: is_active !== "" ? is_active : undefined,
      ordering,
    },
  });
  return res.data;
}

export async function createUser(payload) {
  // payload: { username, nombre, apellido, rol, password, is_active? }
  const res = await api.post("/api/auth/usuarios/", payload);
  return res.data;
}

export async function updateUser(id, payload) {
  // si incluye password, se actualizará
  const res = await api.patch(`/api/auth/usuarios/${id}/`, payload);
  return res.data;
}

export async function deleteUser(id) {
  const res = await api.delete(`/api/auth/usuarios/${id}/`);
  return res.data;
}
