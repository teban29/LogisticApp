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
  forzarCompletarEntrega
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
      const data = await listEnvios(params);
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
      setEnvios((prev) => [...prev, data]);
      setCount((prev) => prev + 1);
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
      const data = await updateEnvioAPI(id, payload);
      setEnvios((prev) =>
        prev.map((envio) => (envio.id === id ? data : envio))
      );
      return data;
    } catch (err) {
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
      setEnvios((prev) => prev.filter((envio) => envio.id !== id));
      setCount((prev) => prev - 1);
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
      setEnvios((prev) =>
        prev.map((envio) => (envio.id === envioId ? data : envio))
      );
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
      setEnvios((prev) =>
        prev.map((envio) => (envio.id === envioId ? data : envio))
      );
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
      setEnvios((prev) =>
        prev.map((envio) => (envio.id === envioId ? data : envio))
      );
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

  // Nuevas funciones para verificación de entrega
  const escanearItemVerificacion = useCallback(async (envioId, codigoBarra, escaneadoPor = '') => {
    setLoading(true);
    setError(null);
    try {
      const data = await escanearItemEntrega(envioId, codigoBarra, escaneadoPor);
      
      // Si la entrega se completó, actualizamos el estado del envío
      if (data.completado) {
        setEnvios((prev) =>
          prev.map((envio) =>
            envio.id === envioId
              ? { ...envio, estado: 'entregado', fecha_entrega_verificada: new Date().toISOString() }
              : envio
          )
        );
      }
      
      return data;
    } catch (err) {
      return handleError(err);
    } finally {
      setLoading(false);
    }
  }, []);

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
      
      // Actualizar el estado del envío en la lista local
      setEnvios((prev) =>
        prev.map((envio) =>
          envio.id === envioId
            ? { ...envio, estado: 'entregado', fecha_entrega_verificada: new Date().toISOString() }
            : envio
        )
      );
      
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
    escanearItemVerificacion,
    obtenerVerificacionEstado,
    obtenerItemsPendientesVerificacion,
    forzarEntregaCompletada,
    clearError: () => setError(null),
  };
};