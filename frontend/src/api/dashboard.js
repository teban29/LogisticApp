import api from './axios';

export const dashboardAPI = {
  // Estadísticas generales
  getEstadisticasGenerales: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return api.get(`/api/dashboard/estadisticas_generales/?${params}`);
  },

  // Top clientes
  getTopClientes: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return api.get(`/api/dashboard/top_clientes/?${params}`);
  },

  // Top proveedores
  getTopProveedores: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return api.get(`/api/dashboard/top_proveedores/?${params}`);
  },

  // Datos para gráficos
  getDatosGraficos: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    return api.get(`/api/dashboard/datos_graficos/?${params}`);
  },

  // Opciones de filtros
  getOpcionesFiltros: () => {
    return api.get('/api/dashboard/opciones_filtros/');
  }
};