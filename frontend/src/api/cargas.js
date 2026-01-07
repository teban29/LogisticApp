// src/api/cargas.js
import api from "./axios";

export async function listCargas(params = {}) {
  const { 
    page = 1, 
    search = "", 
    fecha_rango = "",
    fecha_inicio = "",
    fecha_fin = "",
    ordering = "-created_at" 
  } = params;
  
  const res = await api.get("/api/cargas/", {
    params: {
      page,
      search: search || undefined,
      fecha_rango: fecha_rango || undefined,
      fecha_inicio: fecha_inicio || undefined,
      fecha_fin: fecha_fin || undefined,
      ordering,
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
  form.append("origen", payload.origen);
  form.append("destino", payload.destino);
  form.append("direccion", payload.direccion);

  if (payload.items_data && payload.items_data.length > 0) {
    form.append("items_data", JSON.stringify(payload.items_data));
  }

  if (payload.facturaFile) {
    form.append("factura", payload.facturaFile);
  }

  const res = await api.post("/api/cargas/", form);
  return res.data;
}

export async function updateCarga(id, payload) {
  const form = new FormData();
  if (payload.remision) form.append("remision", payload.remision);
  if (payload.observaciones)
    form.append("observaciones", payload.observaciones);
  if (typeof payload.auto_generar_unidades !== "undefined")
    form.append(
      "auto_generar_unidades",
      payload.auto_generar_unidades ? "true" : "false"
    );
  if (payload.items_data) form.append("items_data", JSON.stringify(payload.items_data));
  if (payload.facturaFile) form.append("factura", payload.facturaFile);
  if (payload.origen) form.append("origen", payload.origen);
  if (payload.destino) form.append("destino", payload.destino);
  if (payload.direccion) form.append("direccion", payload.direccion);

  const res = await api.patch(`/api/cargas/${id}/`, form);
  return res.data;
}

export async function generarUnidades(cargaId) {
  const res = await api.post(`/api/cargas/${cargaId}/generar_unidades/`);
  return res.data;
}

export async function listUnidades(params = {}) {
  const res = await api.get("/api/unidades/", { params });
  return res.data;
}

export async function descargarEtiquetasPorItem(cargaId, itemId) {
  try {
    const response = await api.get(`/api/cargas/${cargaId}/etiquetas/`, {
      params: { item_id: itemId },
      responseType: "blob",
    });
    
    // Verificar si la respuesta es un blob válido (PDF)
    if (response.data instanceof Blob && response.data.type === 'application/pdf') {
      return response.data;
    } else {
      // Si no es un PDF, podría ser un error JSON
      const errorText = await response.data.text();
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.detail || errorData.error || 'Error al generar etiquetas');
      } catch {
        throw new Error('Respuesta inválida del servidor');
      }
    }
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('No tiene permisos para imprimir etiquetas de esta carga');
    }
    if (error.response?.status === 404) {
      throw new Error('Carga o item no encontrado');
    }
    throw error;
  }
}

export async function descargarEtiquetasDeCarga(cargaId) {
  try {
    const response = await api.get(`/api/cargas/${cargaId}/etiquetas/`, {
      responseType: "blob",
    });
    
    if (response.data instanceof Blob && response.data.type === 'application/pdf') {
      return response.data;
    } else {
      const errorText = await response.data.text();
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.detail || errorData.error || 'Error al generar etiquetas');
      } catch {
        throw new Error('Respuesta inválida del servidor');
      }
    }
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('No tiene permisos para imprimir etiquetas de esta carga');
    }
    if (error.response?.status === 404) {
      throw new Error('Carga no encontrada');
    }
    throw error;
  }
}

export function descargarBlobComoPDF(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export function manejarErrorPermisos(error) {
  if (error.response?.status === 403) {
    return 'No tiene permisos para realizar esta acción';
  }
  if (error.response?.status === 404) {
    return 'Recurso no encontrado';
  }
  if (error.response?.data) {
    return error.response.data.detail || error.response.data.error || 'Error del servidor';
  }
  return error.message || 'Error desconocido';
}

// En cargas.js, agregar esta función si no existe
export function parseServerErrors(error) {
  if (!error.response?.data) {
    return { general: error.message || 'Error desconocido' };
  }
  
  const serverData = error.response.data;
  const errors = {};
  
  // Manejar errores de campo específicos
  if (typeof serverData === 'object') {
    Object.keys(serverData).forEach(key => {
      if (Array.isArray(serverData[key])) {
        errors[key] = serverData[key][0];
      } else if (typeof serverData[key] === 'string') {
        errors[key] = serverData[key];
      }
    });
  }
  
  // Si no hay errores de campo específicos, usar error general
  if (Object.keys(errors).length === 0) {
    errors.general = serverData.detail || 'Error del servidor';
  }
  
  return errors;
}

// En src/api/cargas.js, agrega esta función:

export async function descargarConsolidadoPDF(cargaId) {
  try {
    const response = await api.get(`/api/cargas/${cargaId}/consolidado_pdf/`, {
      responseType: "blob",
    });
    
    // Verificar si la respuesta es un blob válido (PDF)
    if (response.data instanceof Blob && response.data.type === 'application/pdf') {
      return response.data;
    } else {
      // Si no es un PDF, podría ser un error JSON
      const errorText = await response.data.text();
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.detail || errorData.error || 'Error al generar consolidado PDF');
      } catch {
        throw new Error('Respuesta inválida del servidor');
      }
    }
  } catch (error) {
    if (error.response?.status === 403) {
      throw new Error('No tiene permisos para descargar el consolidado de esta carga');
    }
    if (error.response?.status === 404) {
      throw new Error('Carga no encontrada');
    }
    if (error.response?.status === 500) {
      throw new Error('Error del servidor al generar el PDF');
    }
    throw error;
  }
}