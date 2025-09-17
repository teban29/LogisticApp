import api from "./axios";

export const listEnvios = async (params = {}) => {
  const response = await api.get("/api/envios/", { params });
  return response.data;
};

export const getEnvio = async (id) => {
  const response = await api.get(`/api/envios/${id}/`);
  return response.data;
};

export const createEnvio = async (payload) => {
  const response = await api.post("/api/envios/", payload);
  return response.data;
};

export const updateEnvio = async (id, payload) => {
  const response = await api.patch(`/api/envios/${id}/`, payload);
  return response.data;
};

export const deleteEnvio = async (id) => {
  const response = await api.delete(`/api/envios/${id}/`);
  return response.data;
};

export const agregarItemEnvio = async (envioId, payload) => {
  const response = await api.post(
    `/api/envios/${envioId}/agregar_item/`,
    payload
  );
  return response.data;
};

export const removerItemEnvio = async (envioId, itemId) => {
  const response = await api.delete(`/api/envios/${envioId}/remover_item/`, {
    data: { item_id: itemId },
  });
  return response.data;
};

export const getCargasPorCliente = async (clienteId) => {
  const response = await api.get(
    `/api/envios/cargas-por-cliente/?cliente_id=${clienteId}`
  );
  return response.data;
};

export const cambiarEstadoEnvio = async (envioId, estado) => {
  const response = await api.patch(`/api/envios/${envioId}/`, { estado });
  return response.data;
};

// Versión mejorada de validarUnidadParaEnvio
export const validarUnidadParaEnvio = async (codigoBarra, clienteId) => {
  try {
    // Primero intentar con el endpoint específico
    try {
      const response = await api.get(
        `/api/cargas/unidades/por-codigo/?codigo_barra=${codigoBarra}`
      );
      const unidad = response.data;

      console.log("DEBUG - Estructura de unidad:", unidad);

      // Verificar que pertenece al cliente
      const unidadClienteId =
        unidad.cliente_id ||
        (unidad.carga_item &&
          unidad.carga_item.carga &&
          unidad.carga_item.carga.cliente);

      if (unidadClienteId !== clienteId) {
        const clienteNombre =
          unidad.cliente_nombre ||
          (unidad.carga_item &&
            unidad.carga_item.carga &&
            unidad.carga_item.carga.cliente_nombre) ||
          `Cliente ID: ${unidadClienteId}`;
        return {
          valida: false,
          error: `La unidad no pertenece a este cliente. Pertenece a: ${clienteNombre}`,
        };
      }

      // Verificar disponibilidad
      if (unidad.estado !== "disponible") {
        return {
          valida: false,
          error: `Unidad no disponible. Estado: ${unidad.estado}`,
        };
      }

      // Extraer el nombre del producto correctamente
      let productoNombre = "Producto";
      let precioReferencia = 0;

      if (unidad.carga_item && unidad.carga_item.producto) {
        productoNombre = unidad.carga_item.producto.nombre || "Producto";
        precioReferencia = unidad.carga_item.producto.precio_referencia || 0;
      } else if (unidad.producto_nombre) {
        productoNombre = unidad.producto_nombre;
      }

      return {
        valida: true,
        unidad: {
          ...unidad,
          carga_item: {
            producto: {
              nombre: productoNombre,
              precio_referencia: precioReferencia,
            },
          },
        },
      };
    } catch (specificError) {
      console.log(
        "Endpoint específico falló, usando general...",
        specificError
      );
      return await validarConEndpointGeneral(codigoBarra, clienteId);
    }
  } catch (err) {
    console.error("Error en validación de unidad:", err);
    return { valida: false, error: "Error al validar la unidad" };
  }
};

// NUEVA FUNCIÓN: Obtener información del producto SIN validaciones de cliente
export const obtenerInfoProductoPorCodigo = async (codigoBarra) => {
  try {
    // Primero intentar con el endpoint específico
    try {
      const response = await api.get(
        `/api/cargas/unidades/por-codigo/?codigo_barra=${codigoBarra}`
      );
      const unidad = response.data;

      console.log("DEBUG - Obteniendo info producto:", unidad);

      // Extraer el nombre del producto sin validaciones
      let productoNombre = "Producto";
      let precioReferencia = 0;

      if (unidad.carga_item && unidad.carga_item.producto) {
        productoNombre = unidad.carga_item.producto.nombre || "Producto";
        precioReferencia = unidad.carga_item.producto.precio_referencia || 0;
      } else if (unidad.producto_nombre) {
        productoNombre = unidad.producto_nombre;
      }

      return {
        encontrado: true,
        producto_nombre: productoNombre,
        precio_referencia: precioReferencia,
        codigo_barra: codigoBarra,
      };
    } catch (specificError) {
      console.log("Endpoint específico falló, usando general...", specificError);
      return await obtenerInfoProductoGeneral(codigoBarra);
    }
  } catch (err) {
    console.error("Error al obtener info del producto:", err);
    return { 
      encontrado: false, 
      producto_nombre: "Producto", 
      error: "Error al consultar producto" 
    };
  }
};

// Función helper para endpoint general (sin validaciones)
const obtenerInfoProductoGeneral = async (codigoBarra) => {
  try {
    const response = await api.get(`/api/cargas/unidades/`);
    const todasLasUnidades = response.data.results || response.data;

    const unidad = todasLasUnidades.find((u) => u.codigo_barra === codigoBarra);

    if (!unidad) {
      return { 
        encontrado: false, 
        producto_nombre: "Producto", 
        error: "Código de barras no encontrado" 
      };
    }

    // Extraer nombre del producto sin validaciones
    let productoNombre = "Producto";
    let precioReferencia = 0;

    if (unidad.carga_item && unidad.carga_item.producto) {
      productoNombre = unidad.carga_item.producto.nombre || "Producto";
      precioReferencia = unidad.carga_item.producto.precio_referencia || 0;
    } else if (unidad.producto_nombre) {
      productoNombre = unidad.producto_nombre;
    }

    return {
      encontrado: true,
      producto_nombre: productoNombre,
      precio_referencia: precioReferencia,
      codigo_barra: codigoBarra,
    };
  } catch (err) {
    console.error("Error en consulta general:", err);
    return { 
      encontrado: false, 
      producto_nombre: "Producto", 
      error: "Error al consultar producto" 
    };
  }
};

// Función helper corregida
const validarConEndpointGeneral = async (codigoBarra, clienteId) => {
  try {
    const response = await api.get(`/api/cargas/unidades/`);
    const todasLasUnidades = response.data.results || response.data;

    const unidad = todasLasUnidades.find((u) => u.codigo_barra === codigoBarra);

    if (!unidad) {
      return { valida: false, error: "Código de barras no encontrado" };
    }

    // Verificar cliente
    const unidadClienteId =
      unidad.carga_item?.carga?.cliente || unidad.cliente_id;
    if (unidadClienteId !== clienteId) {
      const clienteNombre =
        unidad.carga_item?.carga?.cliente_nombre ||
        unidad.cliente_nombre ||
        `Cliente ID: ${unidadClienteId}`;
      return {
        valida: false,
        error: `La unidad no pertenece a este cliente. Pertenece a: ${clienteNombre}`,
      };
    }

    if (unidad.estado !== "disponible") {
      return {
        valida: false,
        error: `Unidad no disponible. Estado: ${unidad.estado}`,
      };
    }

    // Extraer nombre del producto
    let productoNombre = "Producto";
    if (unidad.carga_item && unidad.carga_item.producto) {
      productoNombre = unidad.carga_item.producto.nombre || "Producto";
    } else if (unidad.producto_nombre) {
      productoNombre = unidad.producto_nombre;
    }

    return {
      valida: true,
      unidad: {
        ...unidad,
        carga_item: {
          producto: {
            nombre: productoNombre,
            precio_referencia:
              unidad.carga_item?.producto?.precio_referencia || 0,
          },
        },
      },
    };
  } catch (err) {
    console.error("Error en validación general:", err);
    throw err;
  }
};

export const escanearItemEntrega = async (envioId, codigoBarra, escaneadoPor = '') => {
  const response = await api.post(`/api/envios/${envioId}/escanear-item/`, {
    codigo_barra: codigoBarra,
    escaneado_por: escaneadoPor || 'Sistema'
  });
  return response.data;
};

export const obtenerEstadoVerificacion = async (envioId) => {
  const response = await api.get(`/api/envios/${envioId}/estado-verificacion/`);
  return response.data;
};

export const obtenerItemsPendientes = async (envioId) => {
  const response = await api.get(`/api/envios/${envioId}/items-pendientes/`);
  return response.data;
};

export const forzarCompletarEntrega = async (envioId) => {
  const response = await api.post(`/api/envios/${envioId}/forzar-completar-entrega/`);
  return response.data;
};

export const escaneoMasivo = async (payload) => {
  const response = await api.post("/api/envios/escaneo-masivo/", payload);
  return response.data;
};