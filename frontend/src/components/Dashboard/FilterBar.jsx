import React, { useState, useEffect } from 'react';
import { FiFilter } from 'react-icons/fi';
import { dashboardAPI } from '../../api/dashboard';
import { useAuth } from '../../context/AuthContext';

const FilterBar = ({ onFilterChange, filters, loading = false }) => {
  const { user } = useAuth();
  const [options, setOptions] = useState({
    clientes: [],
    proveedores: [],
    time_filters: []
  });

  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const fetchFilterOptions = async () => {
    try {
      const response = await dashboardAPI.getOpcionesFiltros();
      setOptions(response.data);
    } catch (error) {
      console.error('Error fetching filter options:', error);
      // Opciones por defecto si falla la API
      setOptions({
        clientes: [],
        proveedores: [],
        time_filters: [
          { value: 'today', label: 'Hoy' },
          { value: 'week', label: 'Esta semana' },
          { value: 'month', label: 'Este mes' },
          { value: 'year', label: 'Este año' },
          { value: 'all_time', label: 'Todo el tiempo' }
        ]
      });
    }
  };

  const handleLocalFilterChange = (filterType, value) => {
    const newFilters = {
      ...localFilters,
      [filterType]: value
    };
    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    onFilterChange(localFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      time_filter: 'all_time',
      cliente_id: '',
      proveedor_id: ''
    };
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
      <div className="flex items-center mb-4">
        <FiFilter className="text-gray-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-800">Filtros</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {/* Filtro de tiempo - Siempre visible */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Periodo
          </label>
          <select
            value={localFilters.time_filter || 'all_time'}
            onChange={(e) => handleLocalFilterChange('time_filter', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          >
            {options.time_filters?.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>

        {/* Para usuarios no cliente: mostrar filtros normales */}
        {user.rol !== 'cliente' ? (
          <>
            {/* Filtro de cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente
              </label>
              <select
                value={localFilters.cliente_id || ''}
                onChange={(e) => handleLocalFilterChange('cliente_id', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="">Todos los clientes</option>
                {options.clientes?.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro de proveedor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proveedor
              </label>
              <select
                value={localFilters.proveedor_id || ''}
                onChange={(e) => handleLocalFilterChange('proveedor_id', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="">Todos los proveedores</option>
                {options.proveedores?.map((proveedor) => (
                  <option key={proveedor.id} value={proveedor.id}>
                    {proveedor.nombre}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          // Para usuarios cliente: mostrar información de su cliente
          <div className="md:col-span-2">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">
                Cliente: {user.cliente_nombre || user.cliente?.nombre || 'Tu cliente'}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Solo puedes ver información de tu cliente asignado
              </p>
            </div>
          </div>
        )}

        {/* Contador de filtros activos */}
        <div className="flex items-end">
          <div className="text-sm text-gray-600">
            {[
              localFilters.time_filter !== 'all_time', 
              localFilters.cliente_id, 
              localFilters.proveedor_id
            ].filter(Boolean).length} filtros activos
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3">
        <button
          onClick={applyFilters}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Aplicando...
            </>
          ) : (
            'Aplicar Filtros'
          )}
        </button>
        
        <button
          onClick={clearFilters}
          disabled={loading}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Limpiar Todo
        </button>
      </div>
    </div>
  );
};

export default FilterBar;