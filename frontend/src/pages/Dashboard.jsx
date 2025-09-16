import React, { useState, useEffect } from "react";
import {
  FiPackage,
  FiTruck,
  FiUsers,
  FiUserPlus,
  FiRefreshCw,
} from "react-icons/fi";
import {
  StatsCard,
  FilterBar,
  ChartsSection,
  TopLists,
} from "../components/Dashboard";
import { dashboardAPI } from "../api/dashboard";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_cargas: 0,
    total_envios: 0,
    total_clientes: 0,
    total_proveedores: 0,
    cargas_por_estado: {},
    envios_por_estado: {},
  });

  const [topData, setTopData] = useState({
    top_clientes_cargas: [],
    top_clientes_envios: [],
    top_proveedores: [],
  });

  const [chartData, setChartData] = useState({
    dates: [],
    cargas: [],
    envios: [],
  });

  const [filters, setFilters] = useState({
    time_filter: "all_time",
    cliente_id: "",
    proveedor_id: "",
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  const fetchDashboardData = async () => {
    const isInitialLoad = !refreshing && !filterLoading;
    if (isInitialLoad) setLoading(true);
    if (filterLoading) setFilterLoading(true);

    try {
      // Para usuarios cliente, solo hacer llamadas necesarias
      if (user.rol === 'cliente') {
        const [statsRes, chartRes] = await Promise.all([
          dashboardAPI.getEstadisticasGenerales(filters),
          dashboardAPI.getDatosGraficos(filters),
        ]);

        setStats(statsRes.data);
        setChartData(chartRes.data);
        // Para clientes, topData queda vacío
        setTopData({
          top_clientes_cargas: [],
          top_clientes_envios: [],
          top_proveedores: []
        });
      } else {
        // Para admin/operadores, hacer todas las llamadas
        const [statsRes, topRes, chartRes, proveedoresRes] = await Promise.all([
          dashboardAPI.getEstadisticasGenerales(filters),
          dashboardAPI.getTopClientes(filters),
          dashboardAPI.getDatosGraficos(filters),
          dashboardAPI.getTopProveedores(filters),
        ]);

        setStats(statsRes.data);
        setTopData({
          ...topRes.data,
          top_proveedores: proveedoresRes.data.top_proveedores,
        });
        setChartData(chartRes.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setFilterLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilterLoading(true);
    setFilters(newFilters);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Estado de carga general (solo para carga inicial)
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>

        <div className="h-32 bg-gray-200 rounded-xl mb-6 animate-pulse"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(user.rol === 'cliente' ? 2 : 4)].map((_, i) => (
            <div
              key={i}
              className="h-32 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>

        {user.rol !== 'cliente' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded-xl animate-pulse"></div>
            <div className="h-96 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard de Logística
          </h1>
          <p className="text-gray-600 mt-1">
            Bienvenido, {user?.nombre} {user?.apellido}
            {user.rol === 'cliente' && user.cliente_nombre && (
              <span className="text-blue-600"> - {user.cliente_nombre}</span>
            )}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing || filterLoading}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          <FiRefreshCw className={`mr-2 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Actualizando..." : "Actualizar"}
        </button>
      </div>

      {/* Filtros */}
      <FilterBar
        onFilterChange={handleFilterChange}
        filters={filters}
        loading={filterLoading}
      />

      {/* Indicador de carga de filtros (sutil) */}
      {filterLoading && (
        <div className="mb-4 flex items-center justify-center">
          <FiRefreshCw className="animate-spin text-blue-600 mr-2" />
          <span className="text-sm text-gray-600">Aplicando filtros...</span>
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Cargas"
          value={stats.total_cargas}
          icon={<FiPackage className="text-2xl" />}
          color="text-blue-600"
          subtitle={`Recibidas: ${stats.cargas_por_estado?.recibida || 0}`}
          loading={filterLoading}
        />
        <StatsCard
          title="Total Envíos"
          value={stats.total_envios}
          icon={<FiTruck className="text-2xl" />}
          color="text-green-600"
          subtitle={`Pendientes: ${stats.envios_por_estado?.pendiente || 0}`}
          loading={filterLoading}
        />
        
        {/* Solo mostrar estas cards si no es cliente */}
        {user.rol !== 'cliente' && (
          <>
            <StatsCard
              title="Total Clientes"
              value={stats.total_clientes || 0}
              icon={<FiUsers className="text-2xl" />}
              color="text-purple-600"
              loading={filterLoading}
            />
            <StatsCard
              title="Total Proveedores"
              value={stats.total_proveedores || 0}
              icon={<FiUserPlus className="text-2xl" />}
              color="text-orange-600"
              loading={filterLoading}
            />
          </>
        )}
      </div>

      {/* Para admin/operadores: Gráficos y Top Lists */}
      {user.rol !== 'cliente' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartsSection data={chartData} stats={stats} loading={filterLoading} />
          <TopLists data={topData} loading={filterLoading} user={user} />
        </div>
      ) : (
        /* Para clientes: Mensaje personalizado y gráficos simplificados */
        <>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="text-center py-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Resumen de tu actividad
              </h2>
              <p className="text-gray-600">
                Aquí puedes ver el resumen de cargas y envíos de {user.cliente_nombre || 'tu cliente'}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <ChartsSection data={chartData} stats={stats} loading={filterLoading} />
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;