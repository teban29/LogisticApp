import { useState, useCallback } from "react";
import {
  listEnvios,
  getEnvio as getEnvioAPI,
  createEnvio,
  updateEnvio as updateEnvioAPI,
  deleteEnvio,
  agregarItemEnvio,
  removerItemEnvio,
  getCargasPorCliente,
  cambiarEstadoEnvio,
  escanearItemEntrega,
  obtenerEstadoVerificacion,
  obtenerItemsPendientes,
  forzarCompletarEntrega,
  escaneoMasivo,
} from "../api/envios";

export const useEnvios = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [envios, setEnvios] = useState([]);
  const [count, setCount] = useState(0);

  const handleError = (err) => {
    console.error("Error completo:", err.response?.data);

    const message =
      err.response?.data?.detail ||
      err.response?.data?.error ||
      (typeof err.response?.data === "object"
        ? JSON.stringify(err.response.data)
        : "Error en la operación");

    setError(message);
    throw new Error(message);
  };

  const fetchEnvios = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      // Agregar timestamp para evitar caché
      const timestamp = new Date().getTime();
      const paramsWithCacheBust = {
        ...params,
        _t: timestamp,
      };

      const data = await listEnvios(paramsWithCacheBust);
      const enviosData = data.results || data;
      setEnvios(enviosData);
      setCount(data.count || enviosData.length);
      return data;
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const crearEnvio = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const data = await createEnvio(payload);
      // Después de crear, hacer refresh completo
      const refreshedData = await listEnvios();
      const enviosRefreshed = refreshedData.results || refreshedData;

      setEnvios(enviosRefreshed);
      setCount(refreshedData.count || enviosRefreshed.length);

      return data;
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const actualizarEnvio = useCallback(async (id, payload) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Actualizar el envío
      await updateEnvioAPI(id, payload);

      // 2. IMPORTANTE: Hacer una petición FRESCA para obtener el envío actualizado
      // No confiar en la respuesta del update, hacer un GET aparte
      await new Promise((resolve) => setTimeout(resolve, 500));

      // 3. Obtener el envío actualizado individualmente
      const envioActualizado = await getEnvioAPI(id);

      // 4. Actualizar la lista local
      setEnvios((prev) =>
        prev.map((envio) =>
          envio.id === id ? { ...envio, ...envioActualizado } : envio
        )
      );

      return envioActualizado;
    } catch (err) {
      console.error("Error en actualizarEnvio:", err);
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const eliminarEnvio = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await deleteEnvio(id);
      // Hacer refresh completo después de eliminar
      const refreshedData = await listEnvios();
      const enviosRefreshed = refreshedData.results || refreshedData;

      setEnvios(enviosRefreshed);
      setCount(refreshedData.count || enviosRefreshed.length);

      return { success: true };
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const agregarItem = useCallback(async (envioId, payload) => {
    setLoading(true);
    setError(null);
    try {
      const data = await agregarItemEnvio(envioId, payload);
      // Hacer refresh completo
      const refreshedData = await listEnvios();
      const enviosRefreshed = refreshedData.results || refreshedData;

      setEnvios(enviosRefreshed);
      setCount(refreshedData.count || enviosRefreshed.length);

      return data;
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const removerItem = useCallback(async (envioId, itemId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await removerItemEnvio(envioId, itemId);
      // Hacer refresh completo
      const refreshedData = await listEnvios();
      const enviosRefreshed = refreshedData.results || refreshedData;

      setEnvios(enviosRefreshed);
      setCount(refreshedData.count || enviosRefreshed.length);

      return data;
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const obtenerCargasPorCliente = useCallback(async (clienteId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCargasPorCliente(clienteId);
      return data;
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const cambiarEstado = useCallback(async (envioId, estado) => {
    setLoading(true);
    setError(null);
    try {
      const data = await cambiarEstadoEnvio(envioId, estado);
      // Hacer refresh completo
      const refreshedData = await listEnvios();
      const enviosRefreshed = refreshedData.results || refreshedData;

      setEnvios(enviosRefreshed);
      setCount(refreshedData.count || enviosRefreshed.length);

      return data;
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getEnvio = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEnvioAPI(id);
      return data;
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const procesarEscaneoMasivo = useCallback(
    async (payload) => {
      setLoading(true);
      setError(null);
      try {
        const data = await escaneoMasivo(payload);
        // Hacer refresh completo
        await fetchEnvios();
        return data;
      } catch (err) {
        return handleError(err);
      } finally {
        setLoading(false);
      }
    },
    [fetchEnvios]
  );

  // Nuevas funciones para verificación de entrega
  const escanearItemVerificacion = useCallback(
    async (envioId, codigoBarra, escaneadoPor = "") => {
      setLoading(true);
      setError(null);
      try {
        const data = await escanearItemEntrega(
          envioId,
          codigoBarra,
          escaneadoPor
        );

        // Hacer refresh completo
        const refreshedData = await listEnvios();
        const enviosRefreshed = refreshedData.results || refreshedData;

        setEnvios(enviosRefreshed);
        setCount(refreshedData.count || enviosRefreshed.length);

        return data;
      } catch (err) {
        return handleError(err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const obtenerVerificacionEstado = useCallback(async (envioId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await obtenerEstadoVerificacion(envioId);
      return data;
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const obtenerItemsPendientesVerificacion = useCallback(async (envioId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await obtenerItemsPendientes(envioId);
      return data;
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const forzarEntregaCompletada = useCallback(async (envioId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await forzarCompletarEntrega(envioId);

      // Hacer refresh completo
      const refreshedData = await listEnvios();
      const enviosRefreshed = refreshedData.results || refreshedData;

      setEnvios(enviosRefreshed);
      setCount(refreshedData.count || enviosRefreshed.length);

      return data;
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    envios,
    count,
    fetchEnvios,
    crearEnvio,
    actualizarEnvio,
    eliminarEnvio,
    agregarItem,
    removerItem,
    obtenerCargasPorCliente,
    cambiarEstado,
    getEnvio,
    procesarEscaneoMasivo,
    escanearItemVerificacion,
    obtenerVerificacionEstado,
    obtenerItemsPendientesVerificacion,
    forzarEntregaCompletada,
    clearError: () => setError(null),
  };
};
