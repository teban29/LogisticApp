import React, { useState } from 'react';
import LineChartComponent from './LineChart';
import BarChartComponent from './BarChart';
import PieChartComponent from './PieChart';

const ChartsSection = ({ data, stats, loading = false }) => {
  const [activeTab, setActiveTab] = useState('line');

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Análisis de Datos
        </h3>
        
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'line', label: 'Línea', icon: '📈' },
            { id: 'bar', label: 'Barras', icon: '📊' },
            { id: 'pie', label: 'Estados', icon: '🥧' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'line' && (
        <div className="h-64">
          {data.dates && data.dates.length > 0 ? (
            <LineChartComponent data={data} />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No hay datos para mostrar en el gráfico de líneas
            </div>
          )}
        </div>
      )}

      {activeTab === 'bar' && (
        <div className="h-64">
          {data.dates && data.dates.length > 0 ? (
            <BarChartComponent data={data} />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No hay datos para mostrar en el gráfico de barras
            </div>
          )}
        </div>
      )}

      {activeTab === 'pie' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <PieChartComponent 
              title="Distribución de Cargas" 
              data={stats.cargas_por_estado} 
            />
          </div>
          <div>
            <PieChartComponent 
              title="Distribución de Envíos" 
              data={stats.envios_por_estado} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartsSection;